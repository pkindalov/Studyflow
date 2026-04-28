import { useCallback } from "react";

export function useTimerActions({
  timerTask,
  dateKey,
  openTimer,
  schedule,
  scheduleTimers,
  taskAllocations,
  setScheduleTimers,
  setPendingTimerTask,
  setPendingTimerMinutes,
  resetPomodoroState,
  toggleTask,
  markScheduleItemUndone,
  setRunningTaskId,
  timerOriginDateKeyRef,
  music,
}) {
  const openTimerForTask = useCallback((task) => {
    if (task.scheduledMinutes) { openTimer(task); return; }
    const elapsed = scheduleTimers[task.id] || 0;
    const allocated = taskAllocations[task.id];
    if (task.done) {
      const scheduleTask = schedule?.find((s) => s.id === task.id);
      const minutes = scheduleTask?.scheduledMinutes || allocated || 25;
      setScheduleTimers((prev) => ({ ...prev, [task.id]: minutes * 60 }));
      openTimer({ ...task, scheduledMinutes: minutes });
      return;
    }
    if (elapsed > 0 && allocated) {
      openTimer({ ...task, scheduledMinutes: allocated });
    } else {
      setPendingTimerTask(task);
      setPendingTimerMinutes(25);
    }
  }, [openTimer, scheduleTimers, taskAllocations, schedule, setScheduleTimers, setPendingTimerTask, setPendingTimerMinutes]);

  const restartTimer = useCallback(() => {
    if (!timerTask) return;
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    resetPomodoroState();
    toggleTask(timerOriginDateKeyRef.current || dateKey, timerTask.id);
    markScheduleItemUndone(timerTask.id);
    setRunningTaskId(timerTask.id);
    music.play();
  }, [timerTask, dateKey, setScheduleTimers, resetPomodoroState, toggleTask, timerOriginDateKeyRef, markScheduleItemUndone, setRunningTaskId, music]);

  const startAgainTimer = useCallback(() => {
    if (!timerTask) return;
    const originKey = timerOriginDateKeyRef.current || dateKey;
    const currentElapsed = scheduleTimers[timerTask.id] || 0;
    if (currentElapsed > 0) {
      try {
        const allExtra = JSON.parse(localStorage.getItem("studyflow_focus_extra") || "{}");
        const dayExtra = allExtra[originKey] || {};
        const prev = typeof dayExtra[timerTask.id] === "number" ? dayExtra[timerTask.id] : 0;
        localStorage.setItem("studyflow_focus_extra", JSON.stringify({
          ...allExtra,
          [originKey]: { ...dayExtra, [timerTask.id]: prev + currentElapsed },
        }));
      } catch { /* localStorage not available */ }
    }
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    resetPomodoroState();
    toggleTask(originKey, timerTask.id);
    markScheduleItemUndone(timerTask.id);
    setRunningTaskId(timerTask.id);
    music.play();
  }, [timerTask, dateKey, scheduleTimers, setScheduleTimers, resetPomodoroState, toggleTask, timerOriginDateKeyRef, markScheduleItemUndone, setRunningTaskId, music]);

  return { openTimerForTask, restartTimer, startAgainTimer };
}
