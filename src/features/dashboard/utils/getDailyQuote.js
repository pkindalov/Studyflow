const MS_PER_DAY = 86400000;

export const getDailyQuote = function(quotes, date = new Date()) {
  if (!Array.isArray(quotes) || quotes.length === 0) return null;
  // Use UTC midnight arithmetic to avoid DST-day edge cases (23h/25h days).
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 1)) / MS_PER_DAY
  );
  return quotes[dayOfYear % quotes.length];
};
