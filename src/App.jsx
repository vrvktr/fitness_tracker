import React, { useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { SnackbarProvider, useSnackbar } from 'notistack';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FiActivity, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

Modal.setAppElement('#root');

const STORAGE_KEY = 'healthAndFitness';
const CALORIE_COLORS = { intake: '#a100f2', burned: '#ff9415' };

/** Return today's date in the local YYYY-MM-DD format expected by input[type=date]. */
function todayISO() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Read saved records defensively so malformed browser storage cannot crash the dashboard. */
function loadEntries() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [];

    return saved.filter((item) => (
      item &&
      typeof item.id === 'string' &&
      typeof item.date === 'string' &&
      Number.isFinite(Number(item.calorieIntake)) && Number(item.calorieIntake) >= 0 &&
      Number.isFinite(Number(item.calorieBurned)) && Number(item.calorieBurned) >= 0 &&
      typeof item.description === 'string'
    )).map((item) => ({
      ...item,
      calorieIntake: Number(item.calorieIntake),
      calorieBurned: Number(item.calorieBurned),
    }));
  } catch {
    return [];
  }
}

function EntryForm({ open, entry, onClose, onSave }) {
  const [form, setForm] = useState({
    date: todayISO(),
    calorieIntake: '',
    calorieBurned: '',
    description: '',
  });
  const [error, setError] = useState('');

  // Populate the form each time it opens, with either the selected record or fresh values.
  useEffect(() => {
    if (!open) return;

    setForm(entry ? {
      date: entry.date,
      calorieIntake: String(entry.calorieIntake),
      calorieBurned: String(entry.calorieBurned),
      description: entry.description,
    } : {
      date: todayISO(),
      calorieIntake: '',
      calorieBurned: '',
      description: '',
    });
    setError('');
  }, [open, entry]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function submit(event) {
    event.preventDefault();
    const intake = Number(form.calorieIntake);
    const burned = Number(form.calorieBurned);

    if (!form.date || form.date > todayISO()) {
      setError('Please select a valid date that is not in the future.');
      return;
    }
    if (form.calorieIntake === '' || !Number.isFinite(intake) || intake < 0 || !Number.isInteger(intake)) {
      setError('Enter a whole number of zero or more for calorie intake.');
      return;
    }
    if (form.calorieBurned === '' || !Number.isFinite(burned) || burned < 0 || !Number.isInteger(burned)) {
      setError('Enter a whole number of zero or more for calories burned.');
      return;
    }
    if (!form.description.trim()) {
      setError('Please enter a short description of your meals or exercise.');
      return;
    }

    onSave({
      date: form.date,
      calorieIntake: intake,
      calorieBurned: burned,
      description: form.description.trim(),
    });
  }

  return (
    <Modal
      isOpen={open}
      onRequestClose={onClose}
      className="tracker-modal"
      overlayClassName="modal-overlay"
      contentLabel="Update Today's Data"
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
    >
      <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close form">
        <FiX aria-hidden="true" />
      </button>
      <div className="modal-heading">
        <p className="eyebrow">DAILY CHECK-IN</p>
        <h2>Update Today's Data</h2>
      </div>

      <form className="entry-form" onSubmit={submit} noValidate>
        <label className="form-label" htmlFor="date">Date</label>
        <input
          className="form-control mb-3"
          id="date"
          type="date"
          name="date"
          value={form.date}
          onChange={updateField}
          max={todayISO()}
          required
        />

        <label className="form-label" htmlFor="calorieIntake">Calories Intake</label>
        <input
          className="form-control mb-3"
          id="calorieIntake"
          type="number"
          name="calorieIntake"
          min="0"
          step="1"
          placeholder="Enter Today's Calorie Intake"
          value={form.calorieIntake}
          onChange={updateField}
          required
        />

        <label className="form-label" htmlFor="calorieBurned">Calories Burned</label>
        <input
          className="form-control mb-3"
          id="calorieBurned"
          type="number"
          name="calorieBurned"
          min="0"
          step="1"
          placeholder="Enter Today's Calorie Burned"
          value={form.calorieBurned}
          onChange={updateField}
          required
        />

        <label className="form-label" htmlFor="description">Short Description</label>
        <input
          className="form-control"
          id="description"
          type="text"
          name="description"
          maxLength="300"
          placeholder="Enter a short description"
          value={form.description}
          onChange={updateField}
          required
        />

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="submit" className="btn btn-primary save-action">Submit</button>
          <button type="button" className="btn cancel-action" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function Dashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [entries, setEntries] = useState(loadEntries);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Keep the single source of truth in localStorage between visits and page refreshes.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      enqueueSnackbar('Could not save data in this browser. Check your storage settings.', {
        variant: 'error',
      });
    }
  }, [entries, enqueueSnackbar]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  // The chart is limited to today and the preceding six calendar days.
  const weeklyEntries = useMemo(() => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);
    const startISO = [
      startDate.getFullYear(),
      String(startDate.getMonth() + 1).padStart(2, '0'),
      String(startDate.getDate()).padStart(2, '0'),
    ].join('-');
    const endISO = todayISO();
    const totalsByDate = new Map();

    entries
      .filter((item) => item.date >= startISO && item.date <= endISO)
      .forEach((item) => {
        const totals = totalsByDate.get(item.date) || {
          date: item.date,
          calorieIntake: 0,
          calorieBurned: 0,
        };
        totalsByDate.set(item.date, {
          date: item.date,
          calorieIntake: totals.calorieIntake + item.calorieIntake,
          calorieBurned: totals.calorieBurned + item.calorieBurned,
        });
      });

    return [...totalsByDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const overallTotals = useMemo(() => entries.reduce((totals, item) => ({
    intake: totals.intake + item.calorieIntake,
    burned: totals.burned + item.calorieBurned,
  }), { intake: 0, burned: 0 }), [entries]);

  const combinedCalories = overallTotals.intake + overallTotals.burned;
  const intakePercent = combinedCalories
    ? Math.round((overallTotals.intake / combinedCalories) * 100)
    : 0;
  const burnedPercent = combinedCalories ? 100 - intakePercent : 0;
  const pieData = [
    { name: 'Intake', value: overallTotals.intake, color: CALORIE_COLORS.intake },
    { name: 'Burned', value: overallTotals.burned, color: CALORIE_COLORS.burned },
  ];

  function openAddForm() {
    setEditingEntry(null);
    setFormOpen(true);
  }

  function openEditForm(item) {
    setEditingEntry(item);
    setFormOpen(true);
  }

  function saveEntry(values) {
    if (editingEntry) {
      setEntries((current) => current.map((item) => (
        item.id === editingEntry.id ? { ...item, ...values } : item
      )));
      enqueueSnackbar('Entry updated successfully.', { variant: 'success' });
    } else {
      // Keep one record per date, updating it when the user logs that date again.
      const existingEntry = entries.find((item) => item.date === values.date);
      if (existingEntry) {
        setEntries((current) => current.map((item) => (
          item.id === existingEntry.id ? { ...item, ...values } : item
        )));
        enqueueSnackbar('The entry for this date has been updated.', { variant: 'info' });
      } else {
        const id = globalThis.crypto?.randomUUID?.()
          || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setEntries((current) => [...current, { ...values, id }]);
        enqueueSnackbar('Data added successfully.', { variant: 'success' });
      }
    }

    setFormOpen(false);
    setEditingEntry(null);
  }

  function deleteEntry(item) {
    const confirmed = window.confirm(`Delete data for ${item.date}?`);
    if (!confirmed) return;

    setEntries((current) => current.filter((entry) => entry.id !== item.id));
    enqueueSnackbar('Entry deleted.', { variant: 'success' });
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="brand-mark" aria-hidden="true"><FiActivity /></div>
        <div>
          <p className="header-kicker">YOUR DAILY WELLNESS COMPANION</p>
          <h1>Health And Fitness Tracker</h1>
          <p className="header-subtitle">Small daily choices. Meaningful long-term progress.</p>
        </div>
      </header>

      <section className="dashboard-panel" aria-label="Fitness dashboard">
        <div className="section-topline">
          <div>
            <p className="section-eyebrow">YOUR OVERVIEW</p>
            <h2>Health dashboard</h2>
          </div>
          <span className="date-chip">
            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="top-grid">
          <section className="add-card" aria-labelledby="add-data-title">
            <div className="add-card-icon" aria-hidden="true"><FiActivity /></div>
            <h3 id="add-data-title">Update Today's Data</h3>
            <p>Log your meals, calories and movement to keep your goals on track.</p>
            <button type="button" className="btn btn-add" onClick={openAddForm}>
              + Add data
            </button>
          </section>

          <section className="chart-card" aria-label="Weekly calorie trends">
            {entries.length > 0 && (
              <div className="card-heading">
                <div>
                  <p className="section-eyebrow">AT A GLANCE</p>
                  <h3>Weekly Health Trends</h3>
                </div>
              </div>
            )}
            {weeklyEntries.length > 0 ? (
              <div className="bar-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyEntries} margin={{ top: 12, right: 8, left: -15, bottom: 3 }}>
                    <CartesianGrid strokeDasharray="3 4" stroke="#536075" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => value.slice(5).replace('-', '/')}
                      stroke="#b9c2d1"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#b9c2d1" tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(value) => `Date: ${value}`}
                      contentStyle={{ background: '#202a39', border: '1px solid #536075', borderRadius: 8, color: '#fff' }}
                    />
                    <Legend />
                    <Bar name="Calorie Intake" dataKey="calorieIntake" fill="#8c82e8" radius={[4, 4, 0, 0]} />
                    <Bar name="Calorie Burned" dataKey="calorieBurned" fill="#80cba0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="chart-empty">No data available</div>
            )}
          </section>
        </div>

        <div className="content-grid">
          <section aria-labelledby="recent-statistics-title">
            <div className="section-heading-row">
              <h2 id="recent-statistics-title">Recent Health Statistics</h2>
              <span className="entry-count">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            {sortedEntries.length > 0 ? (
              <div className="entry-list">
                {sortedEntries.map((item) => (
                  <article className="entry-card" key={item.id}>
                    <div className="entry-content">
                      <p className="entry-description">{item.description}</p>
                      <div className="entry-metrics">
                        <span><i className="metric-dot intake-dot" aria-hidden="true" /> Calories Intake: {item.calorieIntake.toLocaleString()}</span>
                        <span><i className="metric-dot burned-dot" aria-hidden="true" /> Calories Burned: {item.calorieBurned.toLocaleString()}</span>
                      </div>
                      <small>{item.date}</small>
                    </div>
                    <div className="entry-actions">
                      <button
                        type="button"
                        className="icon-button edit-button"
                        onClick={() => openEditForm(item)}
                        aria-label={`Edit entry for ${item.date}`}
                        title="Edit entry"
                      >
                        <FiEdit2 aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => deleteEntry(item)}
                        aria-label={`Delete entry for ${item.date}`}
                        title="Delete entry"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><FiActivity aria-hidden="true" /></div>
                <h3>No progress to show!</h3>
                <p>Add your first daily entry to see your health statistics here.</p>
                <button type="button" className="btn btn-add" onClick={openAddForm}>
                  + Add data
                </button>
              </div>
            )}
          </section>

          <aside aria-labelledby="overall-data-title">
            <div className="section-heading-row">
              <h2 id="overall-data-title">Overall Data</h2>
            </div>
            <div className="overall-card">
              {combinedCalories > 0 ? (
                <>
                  <div className="pie-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="48%"
                          outerRadius="75%"
                          paddingAngle={2}
                        >
                          {pieData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kcal`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center" aria-label={`${entries.length} entries logged`}>
                      <strong>{entries.length}</strong>
                      <span>entries</span>
                    </div>
                  </div>
                  <div className="pie-legend">
                    <span><i className="intake-swatch" aria-hidden="true" /> Intake: {intakePercent}%</span>
                    <span><i className="burned-swatch" aria-hidden="true" /> Burned: {burnedPercent}%</span>
                  </div>
                  <div className="total-rows">
                    <p><span>Total intake</span><strong>{overallTotals.intake.toLocaleString()} kcal</strong></p>
                    <p><span>Total burned</span><strong>{overallTotals.burned.toLocaleString()} kcal</strong></p>
                  </div>
                </>
              ) : (
                <div className="overall-empty">
                  <div className="empty-icon" aria-hidden="true">◔</div>
                  <p>Your overall calorie breakdown will appear here.</p>
                  <div className="pie-legend">
                    <span><i className="intake-swatch" aria-hidden="true" /> Intake</span>
                    <span><i className="burned-swatch" aria-hidden="true" /> Burned</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="dashboard-footer">
          <span>Consistency over perfection.</span>
          <span>Your data stays on this device.</span>
        </footer>
      </section>

      <EntryForm
        open={formOpen}
        entry={editingEntry}
        onClose={() => setFormOpen(false)}
        onSave={saveEntry}
      />
    </main>
  );
}

export default function App() {
  return (
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={2800}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Dashboard />
    </SnackbarProvider>
  );
}
