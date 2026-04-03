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

  const addTask = (dateKey, text, imageUrl = "") => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        {
          id: crypto.randomUUID(),
          text,
          done: false,
          imageUrl,
        },
      ],
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

  const editTask = (dateKey, id, text, imageUrl) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, text, imageUrl } : task,
      );

      return { ...prev, [dateKey]: updated };
    });
  };

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    editTask,
  };
}
