export const en = {
  // ── Branding ────────────────────────────────────────────────────────────────
  appName: "Studyflow",
  appTagline: "Study smarter every day",

  // ── Shared ──────────────────────────────────────────────────────────────────
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  delete: "Delete",
  add: "Add",
  restore: "Restore",
  moreViewAll: (n) => `+${n} more — view all`,

  // ── Calendar sidebar ────────────────────────────────────────────────────────
  createTask: "Create Task",
  monthOverview: "Month overview",

  // ── Task modal ───────────────────────────────────────────────────────────────
  taskDescPlaceholder: "Task description...",
  imageUrlPlaceholder: "Image URL (optional)",
  priorityTaskLabel: "Priority Task/Subject",
  repeatLabel: "Repeat",
  noRepeat: "No repeat",
  daily: "Daily",
  monthly: "Monthly",
  yearly: "Yearly",
  custom: "Custom",
  repeatForNext: "Repeat for the next",
  months: "months",
  years: "years",
  fromDate: "From",
  toDate: "To",
  removeEndDate: "Remove end date",
  repeatsDailyNoEnd: "Repeats daily — set an end date to stop automatically.",
  repeatsEveryDayUntil: (month) => `Repeats every day until the end of ${month}.`,
  recurringChangeNote: "Changes to the repeat pattern will apply to all instances.",
  moveToDate: "Move to date",
  addTaskTitle: "Add New Task",
  editTaskTitle: "Edit Task",

  // ── Task card ────────────────────────────────────────────────────────────────
  markIncomplete: "Mark as incomplete",
  markComplete: "Mark as complete",
  taskVisualAlt: "Task visual",
  repeatBadge: "Repeat",
  startTimerAria: "Start timer",
  startTimerTitle: "Start timer for this task",
  excludeFromSchedule: "Exclude from schedule",
  includeInSchedule: "Include in schedule",
  editTaskAria: "Edit task",
  stopRepeatingAria: "Stop repeating",
  stopRepeatingTitle: "Stop this task from repeating on future dates",
  deleteTaskAria: "Delete task",
  deleteTaskConfirm: "Delete task?",
  deleteRecurringWarning: "This is a recurring task — deleting it will remove all its instances.",
  cannotUndo: "This cannot be undone.",

  // ── Task list ────────────────────────────────────────────────────────────────
  tasksHeading: "Priority Tasks",
  selectAll: "Select all",
  deselectAll: "Deselect all",
  viewAllArchives: "View All Archives",
  noTasksMessage: "No tasks for this day.",

  // ── Timer modal ──────────────────────────────────────────────────────────────
  priorityBadge: "Priority",
  remainingLabel: "remaining",
  elapsedLabel: "elapsed",
  toggleTimeFormat: "Toggle time format",
  timerDone: "Done!",
  taskCompletedMsg: "Task time completed! Great work.",
  timerRunningHint: "Timer running — close to pause and save progress",
  timerPausedHint: "Paused — progress saved automatically",
  timerReadyHint: "Press play to start the countdown",
  restart: "Restart",
  pomodoroLabel: "Pomodoro",
  breakEvery: "Break every",
  minUnit: "min",
  enablePomodoro: "Enable Pomodoro",
  disablePomodoro: "Disable Pomodoro",
  cycleLabel: "Cycle",
  breakIn: "break in",
  takeBreak: "Take a break!",
  pausedLeft: (time) => `paused · ${time} left`,
  musicLabel: "Music",
  pauseMusicTitle: "Pause music",
  playMusicTitle: "Play music",
  noTracksTimer: "No tracks — add one in the sidebar.",
  playlistLabel: "Playlist",

  // ── Summary card ─────────────────────────────────────────────────────────────
  focusProgressLabel: "Focus Progress",
  greatProgressMsg: "You're making great progress today.",
  totalLabel: "Total",
  doneLabel: "Done",
  leftLabel: "Left",

  // ── Right sidebar ─────────────────────────────────────────────────────────────
  totalStudyTime: "Total Study Time",
  hoursUnit: "hours",
  priorityTimeLimit: "Priority Time Limit",
  percentOfTotal: "% of total time",
  priorityMaxNote: "Max percent of study time that can be allocated to priority tasks.",
  quote: "\"The secret of getting ahead is getting started.\"",
  quoteAuthor: "Mark Twain",
  activeProjects: "Active Projects",
  todaysTasks: "Today's Tasks",
  nTotal: (n) => `${n} total`,

  // ── Activity panel ────────────────────────────────────────────────────────────
  activityLabel: "Activity",
  streakLabel: "Streak",
  daysUnit: "days",
  startStreakMsg: "Complete a task to start",
  activeTodayMsg: "Active today!",
  keepGoingMsg: "Keep it going!",
  focusTimeLabel: "Focus time",
  hourUnit: "hour",
  hoursUnit2: "hours",
  totalUnit: "total",
  tasksCompletedFn: (n) => `${n} task${n === 1 ? "" : "s"} completed`,
  last6Months: "Last 6 months",

  // ── Music panel ───────────────────────────────────────────────────────────────
  focusMusicLabel: "Focus Music",
  removeTrackTitle: "Remove track",
  noTracksMsg: "No tracks yet. Add one below.",
  addYoutubeTrack: "Add YouTube track",
  trackNamePlaceholder: "Track name...",
  youtubeUrlPlaceholder: "YouTube URL...",
  enterTrackNameError: "Please enter a track name.",
  invalidUrlError: "Invalid YouTube URL.",

  // ── Schedule (App.jsx) ────────────────────────────────────────────────────────
  generateSchedule: "Generate Schedule",
  todaysSchedule: "Today's Schedule",
  saveSchedule: "Save Schedule",
  allDoneNothing: "All tasks are done — nothing left to schedule!",
  noTasksSelected: "No tasks selected for scheduling.",
  scheduleSaved: "Schedule saved successfully!",
  scheduleError: "Error saving schedule.",
  scheduleDeleted: "Schedule deleted.",
  scheduleDeleteError: "Error deleting schedule.",
  completedStatus: "Completed",
  runningStatus: "Running — click to view",
  resumeTimerStatus: "Resume timer",
  startTimerStatus: "Start timer",

  // ── Bottom bar ────────────────────────────────────────────────────────────────
  exportBtn: "Export",
  importBtn: "Import",
  clearBtn: "Clear",
  exportTitle: "Export all data as a backup file",
  importTitle: "Restore data from a backup file",
  clearTitle: "Permanently delete all data",

  // ── Import modal ──────────────────────────────────────────────────────────────
  restoreBackupTitle: "Restore backup?",
  restoreConfirmFn: (date) =>
    `This will replace all current data with the backup from ${date}. The page will reload.`,
  unknownDate: "unknown date",

  // ── Clear modal ───────────────────────────────────────────────────────────────
  clearAllDataTitle: "Clear all data?",
  clearWarningMsg: "This will permanently remove:",
  clearItem1: "All tasks and recurring tasks",
  clearItem2: "All schedules and timer progress",
  clearItem3: "Your music playlist",
  clearItem4: "Your layout and settings",
  clearConfirmBtn: "Yes, delete everything",

  // ── Layout ────────────────────────────────────────────────────────────────────
  resetLayoutBtn: "Reset layout",
  dragToMoveHint: "Drag to move to other column",

  // ── Theme toggle ──────────────────────────────────────────────────────────────
  lightMode: "Light",
  darkMode: "Dark",
  switchToLight: "Switch to light mode",
  switchToDark: "Switch to dark mode",

  // ── Quick-timer prompt ────────────────────────────────────────────────────────
  howManyMinutes: "How many minutes do you want to work on it?",
  startTimerBtn: "Start Timer",

  // ── Help modal ────────────────────────────────────────────────────────────────
  howStudyflowWorks: "How Studyflow works",
  dataNote: "Data lives in your browser — no account needed.",
  gotIt: "Got it",

  helpCreatingTasks: "Creating tasks",
  helpCreatingTip1: (b) => <>Tap {b("Create Task")} in the calendar sidebar to add a task for the selected date.</>,
  helpCreatingTip2: (b) => <>Each task can have a {b("name")}, optional {b("image URL")}, and a {b("priority")} flag (starred tasks get more schedule time).</>,
  helpCreatingTip3: () => <>Double-click a task name to edit it instantly.</>,
  helpCreatingTip4: (b) => <>Use the {b("move to date")} option in the edit modal to reschedule a task to a different day.</>,

  helpRecurring: "Recurring tasks",
  helpRecurringTip1: (b) => <>When creating a task, set a repeat pattern — {b("Daily, Monthly, Yearly")}, or a {b("Custom")} date range.</>,
  helpRecurringTip2: () => <>Recurring tasks appear automatically on every matching date in the calendar.</>,
  helpRecurringTip3: (b) => <>The {b("stop repeating")} button (repeat_off icon) removes all future instances without deleting past ones.</>,

  helpSchedule: "Generating a schedule",
  helpScheduleTip1: (b) => <>Select the tasks you want to include using the {b("calendar tick")} icon on each task card.</>,
  helpScheduleTip2: (b) => <>Set your {b("total study hours")} and {b("priority time limit")} in the sidebar — Studyflow divides your time across tasks automatically.</>,
  helpScheduleTip3: (b) => <>Hit {b("Generate Schedule")} — done tasks are automatically skipped.</>,
  helpScheduleTip4: (b) => <>You can drag schedule items to reorder them, then {b("save")} the schedule so it persists after refresh.</>,

  helpTimer: "Focus timer",
  helpTimerTip1: (b) => <>Click the {b("play")} button on any scheduled task to start a countdown timer.</>,
  helpTimerTip2: () => <>You can also start a quick timer on any task directly from the task list — you'll be asked how many minutes you want to work on it.</>,
  helpTimerTip3: (b) => <>The timer pauses and resumes. Progress is saved automatically — if you close and reopen the timer, it picks up where it left off.</>,
  helpTimerTip4: (b) => <>When time is up the task is marked as done. Hit {b("Restart")} if you need another round.</>,

  helpPomodoro: "Pomodoro mode",
  helpPomodoroTip1: (b) => <>Inside the timer modal, toggle {b("Pomodoro")} on to automatically pause after a set number of minutes (default 25).</>,
  helpPomodoroTip2: () => <>When a pomodoro break triggers, the timer stops — take your break, then press play to start the next cycle.</>,

  helpMusic: "Focus music",
  helpMusicTip1: (b) => <>Add any {b("YouTube URL")} to your playlist from the Music panel in the sidebar.</>,
  helpMusicTip2: () => <>Music plays automatically when the focus timer starts and pauses when it stops.</>,
  helpMusicTip3: () => <>Pick a track from inside the timer modal too — the playlist is always accessible there.</>,

  helpDragDrop: "Drag & drop",
  helpDragDropTip1: () => <>Drag task cards to {<strong className="text-on-surface">reorder</strong>} them within the day.</>,
  helpDragDropTip2: () => <>Drag schedule items to reorder the focus session.</>,
  helpDragDropTip3: (b) => <>Drag sidebar panels (calendar, music, progress…) between the {b("left and right columns")} using the move icon that appears on hover.</>,
  helpDragDropTip4: (b) => <>Click {b("Reset layout")} (bottom-right) to restore the default column arrangement.</>,

  helpData: "Your data & privacy",
  helpDataTip1: (b) => <>All data — tasks, schedules, timers, playlists, layout — is stored in your {b("browser's localStorage")}. Nothing is sent to any server.</>,
  helpDataTip2: (b) => <>Because of this, data is {b("per device and per browser")}. Switching browsers or devices means starting fresh.</>,
  helpDataTip3: () => <>Clearing browser data or site storage will erase everything.</>,
  helpDataTip4: (b) => <>Use {b("Clear all data")} (bottom-left button) if you want to reset the app completely — this action cannot be undone.</>,

  helpTheme: "Light & dark theme",
  helpThemeTip1: (b) => <>Toggle between dark and light mode with the {b("sun/moon button")} in the top-right corner. Your preference is remembered.</>,
};
