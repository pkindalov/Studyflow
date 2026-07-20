import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getSeasonForDate } from "./seasons";

const VALID_CHOICES = new Set(["auto", "spring", "summer", "autumn", "winter"]);
const STORAGE_KEY = "studyflow_theme";

const resolveActiveSeason = (themeChoice) => themeChoice === "auto" ? getSeasonForDate() : themeChoice;

const ThemeContext = createContext({
  themeChoice: "auto",
  setThemeChoice: () => {},
  activeSeason: "winter",
});

export const ThemeProvider = function({ children }) {
  const [themeChoice, setThemeChoiceState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return VALID_CHOICES.has(stored) ? stored : "auto";
    } catch {
      return "auto";
    }
  });

  const setThemeChoice = useCallback((newChoice) => {
    if (!VALID_CHOICES.has(newChoice)) return;
    setThemeChoiceState(newChoice);
    try {
      localStorage.setItem(STORAGE_KEY, newChoice);
    } catch {
      // storage not available
    }
  }, []);

  const activeSeason = resolveActiveSeason(themeChoice);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activeSeason);
  }, [activeSeason]);

  return (
    <ThemeContext.Provider value={{ themeChoice, setThemeChoice, activeSeason }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
