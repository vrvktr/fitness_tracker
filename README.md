# Health and Fitness Tracker

A responsive React + Vite application built with JavaScript (not TypeScript).

## Features
- Add, edit, and delete daily calorie logs
- One log per date; saving another entry for the same date updates it
- Weekly bar chart for calorie intake and calories burned
- Overall intake/burned doughnut chart and totals
- Filter charts and totals by the last 7 days, last 30 days, or all time
- `localStorage` persistence across page refreshes
- Responsive desktop and mobile layout
- Accessible add/edit modal, validation, confirmation before delete, and success notifications

## Requirements
Node.js 20.19+ or 22.12+ recommended (Vite 7 requirement).

## Run locally
```bash
npm install
npm run dev
```
Open the local URL shown by Vite, usually `http://localhost:5173`.

## Production build
```bash
npm run build
npm run preview
```

## Project structure
```text
health-fitness-tracker/
├── index.html
├── package.json
└── src/
    ├── App.jsx
    ├── main.jsx
    └── styles.css
```

## Notes
- Data is stored in this browser under `health-fitness-tracker-entries-v1`.
- Clearing browser site data removes saved logs.
- The supplied screenshots are the visual reference; this implementation recreates their dark dashboard, entry cards, chart panels, and modal behavior with a refined responsive layout.
