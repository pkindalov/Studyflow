import { useCallback } from "react";

export function useTaskActions({
  tasks,
  dateKey,
  deleteTask,
  deleteRecurring,
  deleteAllByRecurringId,
  removeTaskFromSchedule,
  reorderTasks,
  taskBank,
  savedListTexts,
  addToBank,
  removeFromBank,
  showNotification,
  t,
  setShowTaskBankModal,
  setTaskBankModalAutoGenerate,
}) {
  const handleDeleteTask = useCallback((id) => {
    const task = (tasks[dateKey] || []).find((tk) => tk.id === id);
    if (task?.recurringId) {
      deleteRecurring(task.recurringId);
      deleteAllByRecurringId(task.recurringId);
      removeTaskFromSchedule((tk) => tk.recurringId === task.recurringId);
    } else {
      deleteTask(dateKey, id);
      removeTaskFromSchedule((tk) => tk.id === id);
    }
  }, [tasks, dateKey, deleteRecurring, deleteAllByRecurringId, deleteTask, removeTaskFromSchedule]);

  const handleStopRecurring = useCallback((recurringId) => {
    deleteRecurring(recurringId);
    deleteAllByRecurringId(recurringId);
  }, [deleteRecurring, deleteAllByRecurringId]);

  const handleSaveToBank = useCallback((task) => {
    if (savedListTexts.has(task.text)) {
      const bankTask = taskBank.find((bt) => bt.text === task.text);
      if (bankTask) removeFromBank(bankTask.id);
    } else {
      addToBank(task.text, task.priority);
      showNotification(t.saveToList);
    }
  }, [savedListTexts, taskBank, removeFromBank, addToBank, showNotification, t.saveToList]);

  const handleOpenSavedList = useCallback(() => {
    setTaskBankModalAutoGenerate(false);
    setShowTaskBankModal(true);
  }, [setTaskBankModalAutoGenerate, setShowTaskBankModal]);

  const handleReorder = useCallback((draggedId, targetId) => {
    reorderTasks(dateKey, draggedId, targetId);
  }, [reorderTasks, dateKey]);

  return { handleDeleteTask, handleStopRecurring, handleSaveToBank, handleOpenSavedList, handleReorder };
}
