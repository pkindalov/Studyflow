import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SCHEDULES_KEY, readAllSchedules, writeScheduleForDate } from "../utils/scheduleStorage";

export function useSchedule({
  dateKey,
  tasksForDay,
  excludedTaskIds,
  totalStudyTime,
  priorityPercent,
  scheduleTimers,
  setScheduleTimers,
  runningTaskId,
  setRunningTaskId,
  markTaskDone,
  showNotification,
  t,
}) {
  const [schedule, setSchedule] = useState(null);
  const [scheduleUnsaved, setScheduleUnsaved] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const unsavedProceedRef = useRef(null);

  // Load schedule for the selected date
  useEffect(() => {
    const allSchedules = readAllSchedules();
    setSchedule(allSchedules[dateKey] || null);
    setScheduleUnsaved(false);
  }, [dateKey]);

  const allScheduleDone = useMemo(() =>
    !!schedule && schedule.length > 0 && schedule.every((task) =>
      task.done || (scheduleTimers[task.id] || 0) >= task.scheduledMinutes * 60
    ),
  [schedule, scheduleTimers]);

  const scheduleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleScheduleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSchedule((prev) => {
      const from = prev.findIndex((t) => t.id === active.id);
      const to = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, from, to);
    });
  }, []);

  // ─── Core generation logic (pure allocation math) ────────────────────────────
  const doGenerate = useCallback(() => {
    const selectedTasks = tasksForDay.filter((task) => !excludedTaskIds.has(task.id) && !task.done);
    if (totalStudyTime <= 0 || !selectedTasks.length) return false; // signal: nothing to do

    const priorityTasks = selectedTasks.filter((t) => t.priority);
    const nonPriorityTasks = selectedTasks.filter((t) => !t.priority);
    const totalMinutes = Math.max(1, Math.round(totalStudyTime * 60));

    let priorityMinutes = priorityTasks.length && priorityPercent > 0
      ? Math.round((Math.min(priorityPercent, 100) / 100) * totalMinutes)
      : 0;
    let nonPriorityMinutes = totalMinutes - priorityMinutes;

    if (priorityTasks.length === 0) {
      nonPriorityMinutes = totalMinutes;
      priorityMinutes = 0;
    } else if (priorityTasks.length === tasksForDay.length) {
      priorityMinutes = totalMinutes;
      nonPriorityMinutes = 0;
    }

    const allocate = (tasks, budget) => {
      if (tasks.length === 1) return [{ ...tasks[0], scheduledMinutes: budget }];
      const perTask = Math.floor(budget / tasks.length);
      let left = budget;
      return tasks.map((task, i) => {
        const time = i === tasks.length - 1 ? left : perTask;
        left -= time;
        return { ...task, scheduledMinutes: time };
      });
    };

    const scheduleArr = [
      ...allocate(priorityTasks, priorityMinutes),
      ...allocate(nonPriorityTasks, nonPriorityMinutes),
    ].filter((t) => t.scheduledMinutes > 0);

    const prioritySlice = scheduleArr.filter((t) => t.priority).sort(() => Math.random() - 0.5);
    const normalSlice = scheduleArr.filter((t) => !t.priority).sort(() => Math.random() - 0.5);

    setRunningTaskId(null);
    setScheduleTimers({});
    setSchedule([...prioritySlice, ...normalSlice]);
    setScheduleUnsaved(true);
    return true;
  }, [tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent, setRunningTaskId, setScheduleTimers]);

  // ─── Public generate — guards against overwriting unsaved schedule ───────────
  const generateSchedule = useCallback((onNeedsTasks) => {
    const selectedTasks = tasksForDay.filter((task) => !excludedTaskIds.has(task.id) && !task.done);
    if (!selectedTasks.length) {
      if (typeof onNeedsTasks === "function") onNeedsTasks();
      return;
    }
    const proceed = () => doGenerate();
    if (scheduleUnsaved && schedule?.length > 0) {
      unsavedProceedRef.current = proceed;
      setShowUnsavedWarning(true);
    } else {
      proceed();
    }
  }, [tasksForDay, excludedTaskIds, scheduleUnsaved, schedule, doGenerate]);

  // ─── Navigation guard — call before any action that would discard the schedule
  const checkUnsaved = useCallback((callback) => {
    if (scheduleUnsaved && schedule?.length > 0) {
      unsavedProceedRef.current = callback;
      setShowUnsavedWarning(true);
    } else {
      callback();
    }
  }, [scheduleUnsaved, schedule]);

  const saveSchedule = useCallback(() => {
    if (schedule && schedule.length > 0) {
      try {
        writeScheduleForDate(dateKey, schedule);
        setScheduleUnsaved(false);
        showNotification(t.scheduleSaved);
      } catch {
        showNotification(t.scheduleError);
      }
    }
  }, [schedule, dateKey, showNotification, t]);

  const deleteSchedule = useCallback(() => {
    try {
      writeScheduleForDate(dateKey, null);
      setSchedule(null);
      setScheduleUnsaved(false);
      showNotification(t.scheduleDeleted);
    } catch {
      showNotification(t.scheduleDeleteError);
    }
  }, [dateKey, showNotification, t]);

  const handleMarkScheduleItemDone = useCallback((taskId) => {
    const task = schedule?.find((t) => t.id === taskId);
    if (!task) return;
    if (runningTaskId === taskId) setRunningTaskId(null);
    markTaskDone(dateKey, taskId);
    setSchedule((prev) => prev?.map((t) => t.id === taskId ? { ...t, done: true } : t) ?? null);
    setScheduleTimers((prev) => ({ ...prev, [taskId]: task.scheduledMinutes * 60 }));
  }, [schedule, runningTaskId, setRunningTaskId, markTaskDone, dateKey, setScheduleTimers]);

  const handleRemoveScheduleItem = useCallback((taskId) => {
    setSchedule((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      return next.length > 0 ? next : null;
    });
    setScheduleUnsaved(true);
  }, []);

  const removeTaskFromSchedule = useCallback((predicate) => {
    setSchedule((prev) => {
      if (!prev) return null;
      const next = prev.filter((t) => !predicate(t));
      return next.length > 0 ? next : null;
    });
    const existing = readAllSchedules()[dateKey];
    if (existing) {
      writeScheduleForDate(dateKey, existing.filter((t) => !predicate(t)));
    }
  }, [dateKey]);

  const handleUnsavedSaveAndContinue = useCallback(() => {
    saveSchedule();
    unsavedProceedRef.current?.();
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, [saveSchedule]);

  const handleUnsavedDiscard = useCallback(() => {
    unsavedProceedRef.current?.();
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, []);

  const handleUnsavedCancel = useCallback(() => {
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, []);

  const markScheduleItemUndone = useCallback((taskId) => {
    setSchedule((prev) => prev?.map((t) => t.id === taskId ? { ...t, done: false } : t) ?? null);
  }, []);

  const clearSchedule = useCallback(() => {
    setSchedule(null);
    setScheduleUnsaved(false);
    setShowUnsavedWarning(false);
    localStorage.removeItem(SCHEDULES_KEY);
  }, []);

  return {
    schedule,
    setSchedule,
    scheduleUnsaved,
    showUnsavedWarning,
    allScheduleDone,
    scheduleSensors,
    handleScheduleDragEnd,
    generateSchedule,
    checkUnsaved,
    saveSchedule,
    deleteSchedule,
    handleMarkScheduleItemDone,
    handleRemoveScheduleItem,
    markScheduleItemUndone,
    removeTaskFromSchedule,
    handleUnsavedSaveAndContinue,
    handleUnsavedDiscard,
    handleUnsavedCancel,
    clearSchedule,
  };
}
