import { useState, useRef, useEffect } from "react";
import { SEASONS } from "../shared/theme/seasons";

const AUTO_ICON = "auto_awesome";

const SEASON_LABEL_KEYS = {
  spring: "themeSpring",
  summer: "themeSummer",
  autumn: "themeAutumn",
  winter: "themeWinter",
};

export default function SeasonThemePicker({ themeChoice, setThemeChoice, activeSeason, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const options = [
    { id: "auto", icon: AUTO_ICON, label: t.themeAuto },
    ...SEASONS.map((season) => ({ id: season.id, icon: season.icon, label: t[SEASON_LABEL_KEYS[season.id]] })),
  ];

  const activeSeasonIcon = SEASONS.find((season) => season.id === activeSeason)?.icon ?? AUTO_ICON;
  const activeSeasonLabel = t[SEASON_LABEL_KEYS[activeSeason]];
  const buttonLabel = themeChoice === "auto" ? t.themeAuto : activeSeasonLabel;
  const buttonTitle = themeChoice === "auto" ? t.themeAutoHint(activeSeasonLabel) : buttonLabel;

  // Close the menu, optionally returning focus to the trigger button. Focus is
  // restored on Escape and item activation (per the ARIA menu pattern) but not on
  // outside-click, where focus should follow whatever the user clicked instead.
  const closeMenu = (restoreFocus) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = (e) => {
      if (!wrapRef.current?.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);

    const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
    firstItem?.focus();

    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [isOpen]);

  const handleMenuBlur = (event) => {
    if (!wrapRef.current?.contains(event.relatedTarget)) setIsOpen(false);
  };

  // Scoped to this instance via bubbling — unlike a document-level listener,
  // Escape pressed anywhere else on the page (or inside another picker
  // instance) never reaches this handler.
  const handleWrapKeyDown = (event) => {
    if (isOpen && event.key === "Escape") closeMenu(true);
  };

  // Roving focus across menu items: Up/Down cycle, Home/End jump to ends.
  const handleMenuKeyDown = (event) => {
    const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!navigationKeys.includes(event.key)) return;

    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []);
    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex;
    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }
    setActiveMenuIndex(nextIndex);
    items[nextIndex].focus();
  };

  return (
    <div ref={wrapRef} className="relative" onBlur={handleMenuBlur} onKeyDown={handleWrapKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => { setIsOpen((prev) => !prev); setActiveMenuIndex(0); }}
        className={`flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high transition-all ${isOpen ? "text-primary bg-primary/10" : ""}`}
        title={buttonTitle}
        aria-label={buttonTitle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-base icon-filled" aria-hidden="true">{activeSeasonIcon}</span>
        {buttonLabel}
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t.themePickerAria}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-1 z-30 bg-surface-container-highest border border-outline-variant/50 rounded-xl shadow-xl py-1 flex flex-col min-w-[180px]"
        >
          {options.map((option, index) => {
            const isSelected = themeChoice === option.id;
            return (
              <button
                key={option.id}
                role="menuitem"
                tabIndex={index === activeMenuIndex ? 0 : -1}
                aria-current={isSelected}
                onClick={() => { setThemeChoice(option.id); closeMenu(true); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-high ${isSelected ? "text-primary" : "text-on-surface-variant"}`}
              >
                <span className={`material-symbols-outlined text-base flex-shrink-0 ${isSelected ? "icon-filled" : "icon-outlined"}`} aria-hidden="true">{option.icon}</span>
                {option.label}
                {isSelected && (
                  <span className="material-symbols-outlined text-base icon-filled ml-auto text-primary" aria-hidden="true">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
