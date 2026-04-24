import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

export const DEFAULT_LAYOUT = {
  left: ["calendar", "activity"],
  right: ["studyTime", "priorityPercent", "quote", "todaysTasks", "music"],
};

export function useColumnLayout() {
  const [columnLayout, setColumnLayout] = useState(() => {
    try {
      const saved = localStorage.getItem("studyflow_column_layout");
      if (!saved) return DEFAULT_LAYOUT;
      const parsed = JSON.parse(saved);
      const allSaved = [...(parsed.left || []), ...(parsed.right || [])];
      const missingLeft = DEFAULT_LAYOUT.left.filter((id) => !allSaved.includes(id));
      const missingRight = DEFAULT_LAYOUT.right.filter((id) => !allSaved.includes(id));
      if (missingLeft.length > 0 || missingRight.length > 0) {
        return {
          left: [...(parsed.left || []), ...missingLeft],
          right: [...missingRight, ...(parsed.right || [])],
        };
      }
      return parsed;
    } catch { return DEFAULT_LAYOUT; }
  });

  useEffect(() => {
    localStorage.setItem("studyflow_column_layout", JSON.stringify(columnLayout));
  }, [columnLayout]);

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const sectionDragSnapshot = useRef(null);

  const handleSectionDragStart = useCallback(() => {
    setColumnLayout((prev) => { sectionDragSnapshot.current = prev; return prev; });
  }, []);

  const handleSectionDragOver = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeId = active.id;
    const overId = over.id;
    setColumnLayout((prev) => {
      const overInLeft = prev.left.includes(overId);
      const overInRight = prev.right.includes(overId);
      if (!overInLeft && !overInRight) return prev;
      const withoutActive = {
        left: prev.left.filter((id) => id !== activeId),
        right: prev.right.filter((id) => id !== activeId),
      };
      const targetCol = overInLeft ? "left" : "right";
      const list = [...withoutActive[targetCol]];
      const overIdx = list.indexOf(overId);
      if (overIdx === -1) return prev;
      list.splice(overIdx, 0, activeId);
      return { ...withoutActive, [targetCol]: list };
    });
  }, []);

  const handleSectionDragEnd = useCallback(({ over }) => {
    if (!over && sectionDragSnapshot.current) {
      setColumnLayout(sectionDragSnapshot.current);
    }
    sectionDragSnapshot.current = null;
  }, []);

  const resetLayout = useCallback(() => setColumnLayout(DEFAULT_LAYOUT), []);

  const isCustomLayout = useMemo(
    () => JSON.stringify(columnLayout) !== JSON.stringify(DEFAULT_LAYOUT),
    [columnLayout],
  );

  return {
    columnLayout,
    setColumnLayout,
    sectionSensors,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragEnd,
    resetLayout,
    isCustomLayout,
  };
}
