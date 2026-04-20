import { useState, useEffect, useCallback } from "react";
import { generateId } from "../../../shared/utils/id";

const STORAGE_KEY = "studyflow_task_bank";

export function useTaskBank() {
  const [taskBank, setTaskBank] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setTaskBank(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(taskBank));
  }, [taskBank, isLoaded]);

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

  const reorderBank = useCallback((fromId, toId) => {
    setTaskBank((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((t) => t.id === fromId);
      const toIdx = arr.findIndex((t) => t.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }, []);

  return { taskBank, addToBank, removeFromBank, updateInBank, reorderBank };
}
