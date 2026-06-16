import { useMemo } from "react";

export const useActivityStats = function(tasks) {
  const heatmap = useMemo(() => {
    const map = {};
    Object.entries(tasks).forEach(([dateStr, dayTasks]) => {
      const done = dayTasks.filter((task) => task.done).length;
      if (done > 0) map[dateStr] = done;
    });
    return map;
  }, [tasks]);

  const { streak, activeToday } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fmt = (d) => d.toLocaleDateString("en-CA");

    const todayKey = fmt(today);
    const todayDone = (tasks[todayKey] || []).filter((task) => task.done).length > 0;

    let count = 0;
    const checkDate = new Date(today);

    if (todayDone) {
      count = 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Walk backward from yesterday; if today is inactive the streak can still continue from yesterday
    while (true) {
      const key = fmt(checkDate);
      const done = (tasks[key] || []).filter((task) => task.done).length > 0;
      if (!done) break;
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
      // Safety: don't walk back more than 2 years (365 × 2 = 730)
      if (count >= 730) break;
    }

    return { streak: count, activeToday: todayDone };
  }, [tasks]);

  let totalFocusSeconds = 0;
  let todayFocusSeconds = 0;
  try {
    const todayKey = new Date().toLocaleDateString("en-CA");
    const allTimers = JSON.parse(localStorage.getItem("studyflow_schedule_timers") || "{}");
    const allExtra = JSON.parse(localStorage.getItem("studyflow_focus_extra") || "{}");
    const allDates = new Set([...Object.keys(allTimers), ...Object.keys(allExtra)]);
    allDates.forEach((dateKey) => {
      const timers = allTimers[dateKey] || {};
      const extra = allExtra[dateKey] || {};
      const allTaskIds = new Set([...Object.keys(timers), ...Object.keys(extra)]);
      let daySeconds = 0;
      allTaskIds.forEach((taskId) => {
        const timerSec = typeof timers[taskId] === "number" && timers[taskId] > 0 ? timers[taskId] : 0;
        const extraSec = typeof extra[taskId] === "number" && extra[taskId] > 0 ? extra[taskId] : 0;
        daySeconds += timerSec + extraSec;
      });
      totalFocusSeconds += daySeconds;
      if (dateKey === todayKey) todayFocusSeconds = daySeconds;
    });
  } catch { /* localStorage unavailable or data is malformed */ }

  return { streak, activeToday, totalFocusSeconds, todayFocusSeconds, heatmap };
}
