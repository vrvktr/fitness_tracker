import React, { useEffect, useMemo, useState } from 'react';
import Modal from 'react-modal';
import { SnackbarProvider, useSnackbar } from 'notistack';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts';
import {
  FiActivity, FiCalendar, FiCheck, FiEdit2, FiPlus, FiTarget, FiTrash2,
  FiTrendingUp, FiX, FiZap
} from 'react-icons/fi';

Modal.setAppElement('#root');

const STORAGE_KEY = 'health-fitness-tracker-entries-v1';
const todayISO = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const formatDate = (iso) => {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  return `${year}-${month}-${day}`;
};
const readEntries = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

function EntryModal({ isOpen, onClose, onSave, entry }) {
  const [form, setForm] = useState({ date: todayISO(), calorieIntake: '', calorieBurned: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setForm(entry ? {
      date: entry.date,
      calorieIntake: String(entry.calorieIntake),
      calorieBurned: String(entry.calorieBurned),
      description: entry.description || ''
    } : { date: todayISO(), calorieIntake: '', calorieBurned: '', description: '' });
    setError('');
  }, [isOpen, entry]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const intake = Number(form.calorieIntake);
    const burned = Number(form.calorieBurned);
    if (!form.date) return setError('Please select a date.');
    if (form.calorieIntake === '' || !Number.isFinite(intake) || intake < 0) return setError('Enter a valid calorie intake.');
    if (form.calorieBurned === '' || !Number.isFinite(burned) || burned < 0) return setError('Enter valid calories burned.');
    if (!form.description.trim()) return setError('Please add a short description of your meals or exercise.');
    onSave({ ...form, calorieIntake: intake, calorieBurned: burned, description: form.description.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="tracker-modal"
      overlayClassName="modal-overlay"
      contentLabel={entry ? 'Edit daily health data' : 'Add daily health data'}
      closeTimeoutMS={120}
    >
      <div className="modal-heading">
        <div className="eyebrow">{entry ? 'UPDATE YOUR LOG' : 'DAILY CHECK-IN'}</div>
        <h2>{entry ? "Let's see what you want to change!" : 'How many calories did you take today?'}</h2>
        <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close dialog"><FiX /></button>
      </div>
      <form onSubmit={submit} className="entry-form">
        <div className="mb-3">
          <label htmlFor="date" className="form-label">Date</label>
          <input id="date" className="form-control" type="date" name="date" value={form.date} onChange={update} max={todayISO()} required />
        </div>
        <div className="row g-3">
          <div className="col-sm-6">
            <label htmlFor="calorieIntake" className="form-label">Calories consumed</label>
            <div className="input-with-icon"><FiZap /><input id="calorieIntake" className="form-control" type="number" name="calorieIntake" min="0" step="1" placeholder="e.g. 1800" value={form.calorieIntake} onChange={update} required /></div>
          </div>
          <div className="col-sm-6">
            <label htmlFor="calorieBurned" className="form-label">Calories burned</label>
            <div className="input-with-icon"><FiActivity /><input id="calorieBurned" className="form-control" type="number" name="calorieBurned" min="0" step="1" placeholder="e.g. 350" value={form.calorieBurned} onChange={update} required /></div>
          </div>
        </div>
        <div className="mt-3 mb-2">
          <label htmlFor="description" className="form-label">Meals and exercise</label>
          <textarea id="description" className="form-control description-input" name="description" rows="3" maxLength="300" placeholder="Describe what you ate and the activity you did..." value={form.description} onChange={update} required />
          <div className="character-count">{form.description.length}/300</div>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="btn btn-light cancel-action" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary save-action"><FiCheck /> {entry ? 'Save changes' : 'Add entry'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><FiActivity /></div>
      <h3>Your progress starts here</h3>
      <p>Add your first daily check-in to see calorie trends and health statistics.</p>
      <button className="btn btn-primary" onClick={onAdd}><FiPlus /> Add today's data</button>
    </div>
  );
}

function Dashboard() {
  const { enqueueSnackbar } = useSnackbar();
  const [entries, setEntries] = useState(readEntries);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [filter, setFilter] = useState('7');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt),
    [entries]
  );
  const filteredEntries = useMemo(() => {
    const days = filter === 'all' ? Infinity : Number(filter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days === Infinity ? 100000 : days - 1));
    const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    return entries.filter((entry) => entry.date >= cutoffISO);
  }, [entries, filter]);

  const totals = useMemo(() => filteredEntries.reduce((acc, entry) => ({
    intake: acc.intake + entry.calorieIntake,
    burned: acc.burned + entry.calorieBurned
  }), { intake: 0, burned: 0 }), [filteredEntries]);

  const chartData = useMemo(() => {
    const sorted = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
    const byDate = new Map();
    sorted.forEach((entry) => {
      const previous = byDate.get(entry.date) || { date: entry.date, calorieIntake: 0, calorieBurned: 0 };
      byDate.set(entry.date, {
        date: entry.date,
        calorieIntake: previous.calorieIntake + entry.calorieIntake,
        calorieBurned: previous.calorieBurned + entry.calorieBurned
      });
    });
    return [...byDate.values()].slice(-7);
  }, [filteredEntries]);

  const pieData = [
    { name: 'Intake', value: totals.intake, color: '#a100f2' },
    { name: 'Burned', value: totals.burned, color: '#ff9415' }
  ];
  const totalCalories = totals.intake + totals.burned;
  const intakePercent = totalCalories ? Math.round((totals.intake / totalCalories) * 100) : 0;
  const burnedPercent = totalCalories ? 100 - intakePercent : 0;
  const openAdd = () => { setEditingEntry(null); setModalOpen(true); };
  const openEdit = (entry) => { setEditingEntry(entry); setModalOpen(true); };

  const saveEntry = (values) => {
    if (editingEntry) {
      setEntries((current) => current.map((item) => item.id === editingEntry.id ? { ...item, ...values, updatedAt: Date.now() } : item));
      enqueueSnackbar('Your health entry has been updated.', { variant: 'success' });
    } else {
      const existing = entries.find((item) => item.date === values.date);
      if (existing) {
        setEntries((current) => current.map((item) => item.id === existing.id ? { ...item, ...values, updatedAt: Date.now() } : item));
        enqueueSnackbar('An entry already existed for this date, so it was updated.', { variant: 'info' });
      } else {
        setEntries((current) => [...current, { ...values, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, updatedAt: Date.now() }]);
        enqueueSnackbar('Daily health data added!', { variant: 'success' });
      }
    }
    setModalOpen(false);
    setEditingEntry(null);
  };

  const deleteEntry = (entry) => {
    if (!window.confirm(`Delete the health entry for ${entry.date}? This cannot be undone.`)) return;
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    enqueueSnackbar('Entry deleted.', { variant: 'success' });
  };

  return (
    <main className="app-shell">
      <header className="page-header">
        <div className="brand-mark"><FiActivity /></div>
        <div>
          <p className="header-kicker">YOUR DAILY WELLNESS COMPANION</p>
          <h1>Health <span>&amp;</span> Fitness Tracker</h1>
          <p className="header-subtitle">Small daily choices. Meaningful long-term progress.</p>
        </div>
      </header>

      <section className="dashboard-panel">
        <div className="section-topline">
          <div>
            <p className="section-eyebrow">YOUR OVERVIEW</p>
            <h2>Health dashboard</h2>
          </div>
          <div className="date-chip"><FiCalendar /> {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        </div>

        <div className="top-grid">
          <section className="add-card">
            <div className="add-card-icon"><FiTarget /></div>
            <h3>Update today's data</h3>
            <p>Log your meals, calories and movement to keep your goals on track.</p>
            <button className="btn btn-add" onClick={openAdd}><FiPlus /> Add data</button>
          </section>

          <section className="chart-card weekly-card">
            <div className="card-heading">
              <div><p className="section-eyebrow">AT A GLANCE</p><h3>Weekly health trends</h3></div>
              <select className="form-select period-select" aria-label="Chart period" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>
            {chartData.length ? (
              <div className="bar-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 4 }} barGap={5}>
                    <CartesianGrid strokeDasharray="3 4" stroke="#4b5668" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value) => value.slice(5).replace('-', '/')} stroke="#aeb8c8" tick={{ fill: '#aeb8c8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#aeb8c8" tick={{ fill: '#aeb8c8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#202a39', border: '1px solid #465266', borderRadius: 10, color: '#fff' }} labelFormatter={(label) => `Date: ${label}`} />
                    <Legend wrapperStyle={{ color: '#d5dbea', fontSize: 12, paddingTop: 8 }} />
                    <Bar name="Calorie intake" dataKey="calorieIntake" fill="#8c82e8" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar name="Calories burned" dataKey="calorieBurned" fill="#80cba0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="chart-empty"><FiTrendingUp /><span>Your weekly chart will appear after your first entry.</span></div>}
          </section>
        </div>

        <div className="content-grid">
          <section className="recent-section">
            <div className="section-heading-row">
              <div><p className="section-eyebrow">YOUR ACTIVITY</p><h2>Recent health statistics</h2></div>
              <span className="entry-count">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            {sortedEntries.length ? (
              <div className="entry-list">
                {sortedEntries.map((entry) => (
                  <article className="entry-card" key={entry.id}>
                    <div className="entry-date-badge"><span>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span><strong>{new Date(`${entry.date}T12:00:00`).getDate()}</strong></div>
                    <div className="entry-content">
                      <p className="entry-description">{entry.description}</p>
                      <div className="entry-metrics">
                        <span><i className="metric-dot intake-dot" /> Intake <strong>{entry.calorieIntake.toLocaleString()} kcal</strong></span>
                        <span><i className="metric-dot burned-dot" /> Burned <strong>{entry.calorieBurned.toLocaleString()} kcal</strong></span>
                      </div>
                    </div>
                    <div className="entry-actions">
                      <span className="entry-full-date">{formatDate(entry.date)}</span>
                      <button className="icon-button edit-button" onClick={() => openEdit(entry)} aria-label={`Edit entry for ${entry.date}`} title="Edit entry"><FiEdit2 /></button>
                      <button className="icon-button delete-button" onClick={() => deleteEntry(entry)} aria-label={`Delete entry for ${entry.date}`} title="Delete entry"><FiTrash2 /></button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <EmptyState onAdd={openAdd} />}
          </section>

          <aside className="overall-section">
            <div className="section-heading-row">
              <div><p className="section-eyebrow">THE BIG PICTURE</p><h2>Overall data</h2></div>
            </div>
            <div className="overall-card">
              {totalCalories > 0 ? (
                <>
                  <div className="pie-chart-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="52%" outerRadius="76%" paddingAngle={3} stroke="none">
                          {pieData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kcal`, '']} contentStyle={{ background: '#202a39', border: '1px solid #465266', borderRadius: 10, color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-center"><strong>{filteredEntries.length}</strong><span>days logged</span></div>
                  </div>
                  <div className="pie-legend">
                    <div><span className="legend-swatch intake-swatch" /><span>Intake</span><strong>{intakePercent}%</strong></div>
                    <div><span className="legend-swatch burned-swatch" /><span>Burned</span><strong>{burnedPercent}%</strong></div>
                  </div>
                  <div className="total-rows">
                    <div><span>Total intake</span><strong>{totals.intake.toLocaleString()} <small>kcal</small></strong></div>
                    <div><span>Total burned</span><strong>{totals.burned.toLocaleString()} <small>kcal</small></strong></div>
                    <div className="net-row"><span>Net calories</span><strong>{(totals.intake - totals.burned).toLocaleString()} <small>kcal</small></strong></div>
                  </div>
                </>
              ) : <div className="overall-empty"><div className="empty-icon"><FiTarget /></div><p>Your overall calorie breakdown will show here.</p></div>}
            </div>
          </aside>
        </div>
        <footer className="dashboard-footer"><span><FiActivity /> Consistency over perfection.</span><span>Your data stays on this device.</span></footer>
      </section>

      <EntryModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={saveEntry} entry={editingEntry} />
    </main>
  );
}

export default function App() {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Dashboard />
    </SnackbarProvider>
  );
}