function ToolbarButtons({ onShowHelp, lang, setLang, theme, setTheme, t, shadowClass }) {
  return (
    <>
      <button
        onClick={onShowHelp}
        className={`flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high ${shadowClass} transition-all`}
        title={t.howStudyflowWorks}
        aria-label={t.howStudyflowWorks}
      >
        <span className="material-symbols-outlined text-base">help_outline</span>
      </button>
      <div className={`flex items-center bg-surface-container border border-outline-variant/50 rounded-xl ${shadowClass} overflow-hidden`}>
        <button
          onClick={() => setLang("en")}
          aria-label="Switch to English"
          aria-pressed={lang === "en"}
          className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
        >EN</button>
        <button
          onClick={() => setLang("bg")}
          aria-label="Switch to Bulgarian"
          aria-pressed={lang === "bg"}
          className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
        >БГ</button>
      </div>
      <button
        onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
        className={`flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high ${shadowClass} transition-all`}
        title={theme === "dark" ? t.switchToLight : t.switchToDark}
        aria-label={theme === "dark" ? t.switchToLight : t.switchToDark}
      >
        <span className="material-symbols-outlined text-base icon-filled">
          {theme === "dark" ? "light_mode" : "dark_mode"}
        </span>
        {theme === "dark" ? t.lightMode : t.darkMode}
      </button>
    </>
  );
}

export default function TopBar({ onShowHelp, lang, setLang, theme, setTheme, t }) {
  return (
    <>
      {/* Mobile-only top toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-4">
        <div role="toolbar" aria-label={t.appSettingsToolbar} className="flex items-center gap-1.5">
          <ToolbarButtons onShowHelp={onShowHelp} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} shadowClass="shadow-sm" />
        </div>
      </div>

      {/* Desktop fixed top-right */}
      <div role="toolbar" aria-label={t.appSettingsToolbar} className="hidden lg:flex fixed top-5 right-5 z-40 items-center gap-2">
        <ToolbarButtons onShowHelp={onShowHelp} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} t={t} shadowClass="shadow-lg" />
      </div>
    </>
  );
}
