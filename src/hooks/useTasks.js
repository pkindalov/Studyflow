import { useState, useEffect, useCallback } from "react";

export function useTasks() {
  const [tasks, setTasks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("studyflow_tasks");
    if (saved) setTasks(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("studyflow_tasks", JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  const addTask = useCallback((dateKey, text, imageUrl = "", priority = false) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        { id: crypto.randomUUID(), text, done: false, imageUrl, priority: !!priority },
      ],
    }));
  }, []);

  const addTaskDirect = useCallback((dateKey, taskObj) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), taskObj],
    }));
  }, []);

  const toggleTask = useCallback((dateKey, id) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      ),
    }));
  }, []);

  const markTaskDone = useCallback((dateKey, id) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, done: true } : task,
      ),
    }));
  }, []);

  const deleteTask = useCallback((dateKey, id) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter((task) => task.id !== id),
    }));
  }, []);

  const editTask = useCallback((dateKey, id, text, imageUrl, priority = false) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, text, imageUrl, priority: !!priority } : task,
      ),
    }));
  }, []);

  const linkRecurring = useCallback((dateKey, taskId, recurringId) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((t) =>
        t.id === taskId ? { ...t, recurringId } : t,
      ),
    }));
  }, []);

  const deleteAllByRecurringId = useCallback((recurringId) => {
    setTasks((prev) => {
      const next = {};
      for (const key of Object.keys(prev)) {
        next[key] = prev[key].filter((t) => t.recurringId !== recurringId);
      }
      return next;
    });
  }, []);

  const reorderTasks = useCallback((dateKey, draggedId, targetId) => {
    setTasks((prev) => {
      const list = [...(prev[dateKey] || [])];
      const from = list.findIndex((t) => t.id === draggedId);
      const to = list.findIndex((t) => t.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
      return { ...prev, [dateKey]: list };
    });
  }, []);

  const moveTask = useCallback((fromDateKey, toDateKey, taskId) => {
    setTasks((prev) => {
      const fromList = prev[fromDateKey] || [];
      const task = fromList.find((t) => t.id === taskId);
      if (!task) return prev;
      return {
        ...prev,
        [fromDateKey]: fromList.filter((t) => t.id !== taskId),
        [toDateKey]: [...(prev[toDateKey] || []), task],
      };
    });
  }, []);

  const clearAllTasks = useCallback(() => setTasks({}), []);

  return { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks, clearAllTasks };
}
