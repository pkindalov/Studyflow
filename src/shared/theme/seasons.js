// Bulgarian meteorological seasons (fixed calendar months, not astronomical
// equinox/solstice dates): Spring Mar–May, Summer Jun–Aug, Autumn Sep–Nov,
// Winter Dec–Feb.
export const SEASONS = [
  { id: "spring", icon: "local_florist" },
  { id: "summer", icon: "wb_sunny" },
  { id: "autumn", icon: "eco" },
  { id: "winter", icon: "ac_unit" },
];

const MONTH_TO_SEASON = {
  0: "winter", 1: "winter", 2: "spring",
  3: "spring", 4: "spring", 5: "summer",
  6: "summer", 7: "summer", 8: "autumn",
  9: "autumn", 10: "autumn", 11: "winter",
};

export const getSeasonForDate = (date = new Date()) => MONTH_TO_SEASON[date.getMonth()];
