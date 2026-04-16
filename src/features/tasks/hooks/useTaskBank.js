import { useState, useEffect, useCallback } from "react";
import { generateId } from "../../../shared/utils/id";

const STORAGE_KEY = "studyflow_task_bank";

export function useTaskBank() {
  const [taskBank, setTaskBank] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setTaskBank(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(taskBank));
  }, [taskBank]);

  const addToBank = useCallback((text, priority = false) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTaskBank((prev) => {
      if (prev.some((t) => t.text === trimmed && t.priority === priority)) return prev;
      return [...prev, { id: generateId(), text: trimmed, priority: !!priority }];
    });
  }, []);

  const removeFromBank = useCallback((id) => {
    setTaskBank((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateInBank = useCallback((id, text, priority) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTaskBank((prev) => prev.map((t) => t.id === id ? { ...t, text: trimmed, priority: !!priority } : t));
  }, []);

  return { taskBank, addToBank, removeFromBank, updateInBank };
}
