export function computeRecurringEndDate(recurrence, startDate, monthsAhead, yearsAhead, customEndDate) {
  const start = new Date(startDate + "T12:00:00");
  if (recurrence === "daily") {
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return lastDay.toLocaleDateString("en-CA");
  }
  if (recurrence === "monthly") {
    const d = new Date(start);
    d.setMonth(d.getMonth() + Math.max(1, parseInt(monthsAhead) || 3));
    return d.toLocaleDateString("en-CA");
  }
  if (recurrence === "yearly") {
    const d = new Date(start);
    d.setFullYear(d.getFullYear() + Math.max(1, parseInt(yearsAhead) || 2));
    return d.toLocaleDateString("en-CA");
  }
  return customEndDate || "";
}
