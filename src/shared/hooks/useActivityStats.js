import { useMemo } from "react";

/**
 * Derives streak, total focus time, and heatmap data from task and timer state.
 *
 * @param {Object} tasks - The full tasks map: { "YYYY-MM-DD": [{ id, done, ... }] }
 * @returns {{ streak: number, activeToday: boolean, totalFocusSeconds: number, heatmap: Object }}
 */
export function useActivityStats(tasks) {
  const heatmap = useMemo(() => {
    const map = {};
    Object.entries(tasks).forEach(([dateStr, dayTasks]) => {
      const done = dayTasks.filter((t) => t.done).length;
      if (done > 0) map[dateStr] = done;
    });
    return map;
  }, [tasks]);

  const { streak, activeToday } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmt = (d) => d.toLocaleDateString("en-CA");

    const todayKey = fmt(today);
    const todayDone = (tasks[todayKey] || []).filter((t) => t.done).length > 0;

    let count = 0;
    const checkDate = new Date(today);

    if (todayDone) {
      count = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Walk backward from yesterday (or 2 days ago if today was already counted)
    while (true) {
      const key = fmt(checkDate);
      const done = (tasks[key] || []).filter((t) => t.done).length > 0;
      if (!done) break;
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
      // Safety: don't walk back more than 2 years
      if (count > 730) break;
    }

    return { streak: count, activeToday: todayDone };
  }, [tasks]);

  const totalFocusSeconds = useMemo(() => {
    let total = 0;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("schedule_timers_"))
        .forEach((k) => {
          const timers = JSON.parse(localStorage.getItem(k) || "{}");
          Object.values(timers).forEach((sec) => {
            if (typeof sec === "number" && sec > 0) total += sec;
          });
        });
    } catch {
      // localStorage not available
    }
    return total;
  }, [tasks]); // re-compute when tasks change (timers update alongside tasks)

  return { streak, activeToday, totalFocusSeconds, heatmap };
}
