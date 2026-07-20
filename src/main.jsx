import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { LangProvider } from "./shared/i18n/LangContext";
import { ThemeProvider } from "./shared/theme/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LangProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LangProvider>
  </StrictMode>,
);
