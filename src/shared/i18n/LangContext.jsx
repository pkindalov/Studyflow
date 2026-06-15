import { createContext, useContext, useState } from "react";
import { en } from "./en.jsx";
import { bg } from "./bg.jsx";

const LANGS = { en, bg };

const LangContext = createContext({ lang: "en", setLang: () => {}, t: en });

export const LangProvider = function({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("studyflow_lang") || "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l) => {
    setLangState(l);
    try {
      localStorage.setItem("studyflow_lang", l);
    } catch {
      // storage not available
    }
  };

  const t = LANGS[lang] ?? en;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = () => useContext(LangContext);
