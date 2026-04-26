import { useState, useCallback } from "react";
import { computeRecurringEndDate } from "../utils/recurrence";
import { readAllTimers, writeTimersForDate } from "../../schedule/utils/scheduleStorage";

export function useTaskModal({
  mode,
  dateKey,
  tasks,
  recurringTasks,
  addTask,
  addRecurring,
  editTask,
  moveTask,
  updateRecurring,
  linkRecurring,
  deleteRecurring,
  deleteAllByRecurringId,
  removeTaskFromSchedule,
  setScheduleTimers,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [priority, setPriority] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthsAhead, setMonthsAhead] = useState("3");
  const [yearsAhead, setYearsAhead] = useState("2");
  const [taskId, setTaskId] = useState(null);
  const [isRecurringInstance, setIsRecurringInstance] = useState(false);
  const [targetDate, setTargetDate] = useState("");

  const reset = useCallback(() => {
    setIsOpen(false);
    setText("");
    setImage("");
    setPriority(false);
    setRecurrence("none");
    setStartDate("");
    setEndDate("");
    setMonthsAhead("3");
    setYearsAhead("2");
    setTaskId(null);
    setIsRecurringInstance(false);
    setTargetDate("");
  }, []);

  const open = useCallback((arg) => {
    if (mode === "add") {
      if (arg?.startDate) setStartDate(arg.startDate);
      setIsOpen(true);
      return;
    }
    const task = arg;
    setTaskId(task.id);
    setText(task.text);
    setImage(task.imageUrl || "");
    setPriority(task.priority);
    if (task.recurringId) {
      const tpl = recurringTasks.find((r) => r.id === task.recurringId);
      setRecurrence(tpl?.recurrence || "none");
      setStartDate(tpl?.startDate || dateKey);
      setEndDate(tpl?.endDate || "");
      setIsRecurringInstance(true);
      setTargetDate("");
    } else {
      setRecurrence("none");
      setStartDate(dateKey);
      setEndDate("");
      setIsRecurringInstance(false);
      setTargetDate(dateKey);
    }
    setIsOpen(true);
  }, [mode, dateKey, recurringTasks]);

  const handleSubmit = useCallback(() => {
    const sd = startDate || dateKey;
    if (mode === "add") {
      if (recurrence !== "none") {
        const actualRecurrence = recurrence === "custom" ? "daily" : recurrence;
        const ed = computeRecurringEndDate(recurrence, sd, monthsAhead, yearsAhead, endDate);
        addRecurring(text, image, priority, actualRecurrence, sd, ed);
      } else {
        addTask(dateKey, text, image, priority);
      }
    } else {
      editTask(dateKey, taskId, text, image, priority);
      if (targetDate && targetDate !== dateKey) {
        moveTask(dateKey, targetDate, taskId);
        removeTaskFromSchedule((t) => t.id === taskId);
        setScheduleTimers((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        try {
          const allTimers = readAllTimers();
          const targetTimers = { ...(allTimers[targetDate] || {}) };
          delete targetTimers[taskId];
          writeTimersForDate(targetDate, targetTimers);
        } catch { /* ignore */ }
      }
      const task = (tasks[dateKey] || []).find((t) => t.id === taskId);
      if (recurrence !== "none") {
        const actualRecurrence = recurrence === "custom" ? "daily" : recurrence;
        const ed = computeRecurringEndDate(recurrence, sd, monthsAhead, yearsAhead, endDate);
        if (task?.recurringId) {
          updateRecurring(task.recurringId, text, image, priority, actualRecurrence, sd, ed);
        } else {
          const newId = addRecurring(text, image, priority, actualRecurrence, sd, ed);
          linkRecurring(dateKey, taskId, newId);
        }
      } else if (task?.recurringId) {
        deleteRecurring(task.recurringId);
        deleteAllByRecurringId(task.recurringId);
        linkRecurring(dateKey, taskId, null);
      }
    }
    reset();
  }, [
    mode, dateKey, taskId, text, image, priority, recurrence,
    startDate, endDate, monthsAhead, yearsAhead, targetDate,
    tasks, addTask, addRecurring, editTask, moveTask, updateRecurring,
    linkRecurring, deleteRecurring, deleteAllByRecurringId,
    removeTaskFromSchedule, setScheduleTimers, reset,
  ]);

  return {
    isOpen, setIsOpen,
    text, setText,
    image, setImage,
    priority, setPriority,
    recurrence, setRecurrence,
    startDate, setStartDate,
    endDate, setEndDate,
    monthsAhead, setMonthsAhead,
    yearsAhead, setYearsAhead,
    taskId,
    isRecurringInstance,
    targetDate, setTargetDate,
    open,
    reset,
    handleSubmit,
  };
}
