import { useState, useEffect } from "react";

const STORAGE_KEY = "studyflow_recurring";

export function appliesToDate(template, dateKey) {
  if (dateKey < template.startDate) return false;
  if (template.endDate && dateKey > template.endDate) return false;
  const date = new Date(dateKey + "T12:00:00");
  const start = new Date(template.startDate + "T12:00:00");

  switch (template.recurrence) {
    case "daily":
      return true;
    case "weekly":
      return date.getDay() === start.getDay();
    case "monthly":
      return date.getDate() === start.getDate();
    case "yearly":
      return date.getMonth() === start.getMonth() && date.getDate() === start.getDate();
    default:
      return false;
  }
}

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function recurrenceLabel(template) {
  const start = new Date(template.startDate + "T12:00:00");
  let label = "";
  switch (template.recurrence) {
    case "daily":   label = "Every day"; break;
    case "weekly":  label = `Every ${DAY_NAMES[start.getDay()]}`; break;
    case "monthly": label = `Monthly on the ${start.getDate()}${ordinal(start.getDate())}`; break;
    case "yearly":  label = `Yearly on ${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`; break;
    default:        label = "";
  }
  if (template.endDate) label += ` · ends ${template.endDate}`;
  return label;
}

export function useRecurringTasks() {
  const [recurringTasks, setRecurringTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringTasks));
  }, [recurringTasks]);

  function addRecurring(text, imageUrl, priority, recurrence, startDate, endDate = "") {
    const id = crypto.randomUUID();
    setRecurringTasks((prev) => [
      ...prev,
      {
        id,
        text,
        imageUrl: imageUrl || "",
        priority: !!priority,
        recurrence,
        startDate,
        endDate: endDate || "",
        skippedDates: [],
      },
    ]);
    return id;
  }

  function updateRecurring(id, text, imageUrl, priority, recurrence, startDate, endDate) {
    setRecurringTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text, imageUrl: imageUrl || "", priority: !!priority, recurrence, startDate, endDate: endDate || "" }
          : t,
      ),
    );
  }

  function deleteRecurring(id) {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function skipDate(id, dateKey) {
    setRecurringTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, skippedDates: [...(t.skippedDates || []), dateKey] }
          : t,
      ),
    );
  }

  return { recurringTasks, addRecurring, updateRecurring, deleteRecurring, skipDate };
}
