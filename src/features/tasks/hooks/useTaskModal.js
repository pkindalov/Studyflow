import { useState, useCallback } from "react";
import { computeRecurringEndDate } from "../utils/recurrence";

export const useTaskModal = function({
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
  onCleanupTimer,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [priority, setPriority] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [dateMode, setDateMode] = useState("single");
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
    setDateMode("single");
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
      setStartDate(arg?.startDate || dateKey);
      setDateMode("single");
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
      setDateMode(tpl?.endDate ? "range" : "single");
      setIsRecurringInstance(true);
      setTargetDate("");
    } else {
      setRecurrence("none");
      setStartDate(dateKey);
      setEndDate("");
      setDateMode("single");
      setIsRecurringInstance(false);
      setTargetDate(dateKey);
    }
    setIsOpen(true);
  }, [mode, dateKey, recurringTasks]);

  const handleSubmit = useCallback(() => {
    const trimmedText = text.trim();
    const trimmedImage = image.trim();
    if (!trimmedText) return;
    const sd = startDate || dateKey;
    const isRecurring = recurrence !== "none" || dateMode === "range";

    if (mode === "add") {
      if (isRecurring) {
        const actualRecurrence = recurrence !== "none" ? recurrence : "daily";
        const ed = computeRecurringEndDate(actualRecurrence, sd, monthsAhead, yearsAhead, endDate);
        addRecurring(trimmedText, trimmedImage, priority, actualRecurrence, sd, ed);
      } else {
        addTask(dateKey, trimmedText, trimmedImage, priority);
      }
    } else {
      editTask(dateKey, taskId, trimmedText, trimmedImage, priority);
      if (targetDate && targetDate !== dateKey) {
        moveTask(dateKey, targetDate, taskId);
        removeTaskFromSchedule((t) => t.id === taskId);
        setScheduleTimers((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        onCleanupTimer?.(dateKey, taskId);
      }
      const effectiveDateKey = (targetDate && targetDate !== dateKey) ? targetDate : dateKey;
      const task = (tasks[dateKey] || []).find((t) => t.id === taskId);
      if (isRecurring) {
        const actualRecurrence = recurrence !== "none" ? recurrence : "daily";
        const ed = computeRecurringEndDate(actualRecurrence, sd, monthsAhead, yearsAhead, endDate);
        if (task?.recurringId) {
          updateRecurring(task.recurringId, trimmedText, trimmedImage, priority, actualRecurrence, sd, ed);
        } else {
          const newId = addRecurring(trimmedText, trimmedImage, priority, actualRecurrence, sd, ed);
          linkRecurring(effectiveDateKey, taskId, newId);
        }
      } else if (task?.recurringId) {
        deleteRecurring(task.recurringId);
        linkRecurring(effectiveDateKey, taskId, null);
        deleteAllByRecurringId(task.recurringId);
      }
    }
    reset();
  }, [
    mode, dateKey, taskId, text, image, priority, recurrence, dateMode,
    startDate, endDate, monthsAhead, yearsAhead, targetDate,
    tasks, addTask, addRecurring, editTask, moveTask, updateRecurring,
    linkRecurring, deleteRecurring, deleteAllByRecurringId,
    removeTaskFromSchedule, setScheduleTimers, onCleanupTimer, reset,
  ]);

  const handleSetRecurrence = useCallback((value) => {
    setRecurrence(value);
    if (value === "none") {
      setDateMode("single");
      setEndDate("");
    }
  }, []);

  const handleSetDateMode = useCallback((newMode) => {
    setDateMode(newMode);
    if (newMode === "single") {
      setEndDate("");
    }
    if (newMode === "range") {
      setRecurrence((prev) => prev === "none" ? "daily" : prev);
    }
  }, []);

  return {
    isOpen, setIsOpen,
    text, setText,
    image, setImage,
    priority, setPriority,
    recurrence, handleSetRecurrence,
    dateMode, handleSetDateMode,
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
