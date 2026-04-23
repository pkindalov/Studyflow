export const SCHEDULES_KEY = "studyflow_schedules";
export const TIMERS_KEY = "studyflow_schedule_timers";

export const readAllSchedules = () => {
  try { return JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || {}; } catch { return {}; }
};

export const readAllTimers = () => {
  try { return JSON.parse(localStorage.getItem(TIMERS_KEY)) || {}; } catch { return {}; }
};

export const writeScheduleForDate = (dateKey, schedule) => {
  const all = readAllSchedules();
  if (!schedule || schedule.length === 0) { delete all[dateKey]; }
  else { all[dateKey] = schedule; }
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(all));
};

export const writeTimersForDate = (dateKey, timers) => {
  const all = readAllTimers();
  if (!timers || Object.keys(timers).length === 0) { delete all[dateKey]; }
  else { all[dateKey] = timers; }
  localStorage.setItem(TIMERS_KEY, JSON.stringify(all));
};
