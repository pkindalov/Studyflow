import { SCHEDULES_KEY, TIMERS_KEY } from "./scheduleStorage";

export function runMigrations() {
  const readAll = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const schedules = readAll(SCHEDULES_KEY);
  const timers    = readAll(TIMERS_KEY);
  let migratedSchedules = false;
  let migratedTimers    = false;
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("schedule_timers_")) {
      const dk = k.slice("schedule_timers_".length);
      try { const v = JSON.parse(localStorage.getItem(k)); if (v && Object.keys(v).length > 0) { timers[dk] = v; migratedTimers = true; } } catch { /* ignore */ }
      localStorage.removeItem(k);
    } else if (k.startsWith("schedule_")) {
      const dk = k.slice("schedule_".length);
      try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.length > 0) { schedules[dk] = v; migratedSchedules = true; } } catch { /* ignore */ }
      localStorage.removeItem(k);
    }
  });
  if (migratedSchedules) localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  if (migratedTimers)    localStorage.setItem(TIMERS_KEY,    JSON.stringify(timers));
}
