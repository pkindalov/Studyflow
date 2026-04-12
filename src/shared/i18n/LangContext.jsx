import { createContext, useContext, useState } from "react";
import { en } from "./en.jsx";
import { bg } from "./bg.jsx";

const LANGS = { en, bg };

const LangContext = createContext({ lang: "en", setLang: () => {}, t: en });

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem("studyflow_lang") || "en"
  );

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("studyflow_lang", l);
  };

  const t = LANGS[lang] ?? en;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
