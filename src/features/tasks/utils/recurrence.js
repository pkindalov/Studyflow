export const computeRecurringEndDate = function(recurrence, startDate, monthsAhead, yearsAhead, userEndDate) {
  const start = new Date(startDate + "T12:00:00");
  if (userEndDate) return userEndDate;
  if (recurrence === "weekly") return "";
  if (recurrence === "daily") {
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return lastDay.toLocaleDateString("en-CA");
  }
  if (recurrence === "monthly") {
    const targetMonth = start.getMonth() + Math.max(1, parseInt(monthsAhead, 10) || 3);
    const lastDayOfTarget = new Date(start.getFullYear(), targetMonth + 1, 0).getDate();
    const targetDay = Math.min(start.getDate(), lastDayOfTarget);
    return new Date(start.getFullYear(), targetMonth, targetDay).toLocaleDateString("en-CA");
  }
  if (recurrence === "yearly") {
    const targetYear = start.getFullYear() + Math.max(1, parseInt(yearsAhead, 10) || 2);
    const lastDayOfTarget = new Date(targetYear, start.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(start.getDate(), lastDayOfTarget);
    return new Date(targetYear, start.getMonth(), targetDay).toLocaleDateString("en-CA");
  }
  return "";
}
