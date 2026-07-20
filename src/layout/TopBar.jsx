import SeasonThemePicker from "./SeasonThemePicker";

const ToolbarButtons = function({ onShowHelp, lang, setLang, themeChoice, setThemeChoice, activeSeason, showBackgroundArt, setShowBackgroundArt, t }) {
  return (
    <>
      <button
        onClick={onShowHelp}
        className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-all"
        title={t.howStudyflowWorks}
        aria-label={t.howStudyflowWorks}
      >
        <span className="material-symbols-outlined text-base">help_outline</span>
      </button>
      <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl overflow-hidden">
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
        onClick={() => setShowBackgroundArt((prev) => !prev)}
        className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high transition-all"
        title={showBackgroundArt ? t.hideBackgroundArt : t.showBackgroundArt}
        aria-label={showBackgroundArt ? t.hideBackgroundArt : t.showBackgroundArt}
        aria-pressed={showBackgroundArt}
      >
        <span className="material-symbols-outlined text-base">
          {showBackgroundArt ? "landscape" : "hide_image"}
        </span>
      </button>
      <SeasonThemePicker themeChoice={themeChoice} setThemeChoice={setThemeChoice} activeSeason={activeSeason} t={t} />
    </>
  );
}

export default function TopBar({ onShowHelp, lang, setLang, themeChoice, setThemeChoice, activeSeason, showBackgroundArt, setShowBackgroundArt, t }) {
  return (
    <>
      {/* Mobile toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-headline font-bold text-base text-on-surface">{t.appName}</span>
        </div>
        <div role="toolbar" aria-label={t.appSettingsToolbar} className="flex items-center gap-1.5">
          <ToolbarButtons onShowHelp={onShowHelp} lang={lang} setLang={setLang} themeChoice={themeChoice} setThemeChoice={setThemeChoice} activeSeason={activeSeason} showBackgroundArt={showBackgroundArt} setShowBackgroundArt={setShowBackgroundArt} t={t} />
        </div>
      </div>

      {/* Desktop sticky header */}
      <header className="hidden lg:flex sticky top-0 z-40 items-center gap-4 mb-6 py-3 bg-surface-container/80 backdrop-blur border-b border-outline-variant/30 -mx-6 px-6">
        <div className="flex items-center gap-2.5 flex-1">
          <span className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <span className="material-symbols-outlined text-on-primary text-base icon-filled">auto_stories</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-headline font-bold text-base text-on-surface">{t.appName}</span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">{t.appTagline}</span>
          </div>
        </div>

        <div role="toolbar" aria-label={t.appSettingsToolbar} className="flex items-center gap-2">
          <ToolbarButtons onShowHelp={onShowHelp} lang={lang} setLang={setLang} themeChoice={themeChoice} setThemeChoice={setThemeChoice} activeSeason={activeSeason} showBackgroundArt={showBackgroundArt} setShowBackgroundArt={setShowBackgroundArt} t={t} />
        </div>
      </header>
    </>
  );
}
