import { useState, useEffect } from "react";

export function useTasks() {
  const [tasks, setTasks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studyflow_tasks");
    if (saved) setTasks(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded)
      localStorage.setItem("studyflow_tasks", JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  const addTask = (dateKey, text, imageUrl = "", priority = false) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        {
          id: crypto.randomUUID(),
          text,
          done: false,
          imageUrl,
          priority: !!priority,
        },
      ],
    }));
  };

  // Adds a pre-formed task object (used for auto-populating recurring tasks)
  const addTaskDirect = (dateKey, taskObj) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), taskObj],
    }));
  };

  const toggleTask = (dateKey, id) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      );

      return { ...prev, [dateKey]: updated };
    });
  };

  const deleteTask = (dateKey, id) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).filter((task) => task.id !== id);

      return { ...prev, [dateKey]: updated };
    });
  };

  const editTask = (dateKey, id, text, imageUrl, priority = false) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).map((task) =>
        task.id === id
          ? { ...task, text, imageUrl, priority: !!priority }
          : task,
      );
      return { ...prev, [dateKey]: updated };
    });
  };

  const linkRecurring = (dateKey, taskId, recurringId) => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map((t) =>
        t.id === taskId ? { ...t, recurringId } : t,
      ),
    }));
  };

  return {
    tasks,
    addTask,
    addTaskDirect,
    toggleTask,
    deleteTask,
    editTask,
    linkRecurring,
  };
}
