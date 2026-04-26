export default function TopBar({ onShowHelp, lang, setLang, theme, setTheme, t }) {
  return (
    <>
      {/* Mobile-only top toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onShowHelp}
            className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high shadow-sm transition-all"
            title={t.howStudyflowWorks}
            aria-label="Help"
          >
            <span className="material-symbols-outlined text-base">help_outline</span>
          </button>
          <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >EN</button>
            <button
              onClick={() => setLang("bg")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >БГ</button>
          </div>
          <button
            onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all"
            title={theme === "dark" ? t.switchToLight : t.switchToDark}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            {theme === "dark" ? t.lightMode : t.darkMode}
          </button>
        </div>
      </div>

      {/* Desktop fixed top-right */}
      <div className="hidden lg:flex fixed top-5 right-5 z-40 items-center gap-2">
        <button
          onClick={onShowHelp}
          className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high shadow-lg transition-all"
          title={t.howStudyflowWorks}
          aria-label="Help"
        >
          <span className="material-symbols-outlined text-base">help_outline</span>
        </button>
        <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >EN</button>
          <button
            onClick={() => setLang("bg")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >БГ</button>
        </div>
        <button
          onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all"
          title={theme === "dark" ? t.switchToLight : t.switchToDark}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          {theme === "dark" ? t.lightMode : t.darkMode}
        </button>
      </div>
    </>
  );
}
