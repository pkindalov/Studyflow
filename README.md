# Studyflow

A personal productivity app for planning your day, tracking tasks, and staying focused — built with React and Tailwind CSS.

## Features

- **Task management** — create, edit, and delete tasks with optional images, priority flags, and categories
- **Recurring tasks** — set tasks to repeat daily, weekly, monthly, yearly, or on a custom date range
- **Schedule generator** — automatically allocates your study time across selected tasks, respecting priority limits
- **Focus timer** — countdown timer per task with pomodoro break support, pause/resume, and auto-completion
- **Focus music** — add YouTube tracks to a playlist that plays during your timer sessions
- **Calendar** — visual date picker with dot indicators on days that have tasks
- **Progress tracking** — live progress bars per task and a circular overall progress ring
- **Light / dark theme** — toggle between a deep navy dark mode and a warm lavender light mode, persisted across sessions
- **Drag-and-drop** — reorder tasks, schedule items, and sidebar sections by dragging
- **Customisable layout** — move sidebar panels between left and right columns, reset to default anytime
- **Clear all data** — wipe everything with a single confirmed action

## Tech Stack

- [React 19](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS v3](https://tailwindcss.com)
- [react-calendar](https://github.com/wojtekmaj/react-calendar)
- YouTube IFrame API (no extra package)
- `localStorage` for persistence — no backend required

## Project Structure

```
src/
  features/
    tasks/        # TaskCard, TaskList, TaskModal, useTasks, useRecurringTasks
    schedule/     # TimerModal, SummaryCard
    calendar/     # CalendarSidebar, markDateWithTasks util, calendar.css
    music/        # MusicPanel, useMusicPlayer, YouTube service
    dashboard/    # RightSidebar panels (study time, priority, quote, progress)
  shared/
    components/   # Pagination
  App.jsx
  main.jsx
  index.css       # CSS custom properties for both themes
  animations.css
```

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Expose to your local network (open on phone/tablet)
npm run dev -- --host

# Build for production
npm run build
```

## Data & Privacy

Everything is stored in your browser's `localStorage`. No account, no server, no data leaves your device.
