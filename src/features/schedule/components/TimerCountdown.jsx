import { useLang } from "../../../shared/i18n/LangContext";

const formatTime = function(seconds, hms) {
  if (hms) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const TimerCountdown = function({ remaining, totalSeconds, elapsedSeconds, isRunning, isFinished, hmsMode, onToggleHmsMode }) {
  const { t } = useLang();

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - (totalSeconds > 0 ? remaining / totalSeconds : 0));

  return (
    <>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-surface-container-high" />
          {/* style required for SVG stroke-dashoffset animation — not expressible as a Tailwind class */}
          <circle
            cx="100" cy="100" r={radius} fill="none" stroke="currentColor" strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
            className={isFinished ? "text-tertiary" : isRunning ? "text-primary" : "text-secondary"}
            transform="rotate(-90 100 100)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="relative flex flex-col items-center justify-center select-none">
          {isFinished ? (
            <div className="flex flex-col items-center gap-1">
              <span className="material-symbols-outlined text-tertiary text-5xl">check_circle</span>
              <span className="text-tertiary font-bold text-sm">{t.timerDone}</span>
            </div>
          ) : (
            <>
              <span className="text-3xl font-mono font-bold text-on-surface tabular-nums">{formatTime(remaining, hmsMode)}</span>
              <span className="text-xs text-on-surface-variant mt-0.5">{t.remainingLabel}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">timer</span>
          <span className="font-mono text-on-surface">{formatTime(elapsedSeconds, hmsMode)}</span>
          <span>/</span>
          <span className="font-mono">{formatTime(totalSeconds, hmsMode)}</span>
          <span className="ml-1">{t.elapsedLabel}</span>
        </div>
        <button
          onClick={onToggleHmsMode}
          className="text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant/60 hover:text-on-surface-variant border border-outline-variant/30 hover:border-outline-variant/60 rounded-full px-2.5 py-0.5 transition-all"
          title={t.toggleTimeFormat}
        >
          {hmsMode ? "MM:SS" : "HH:MM:SS"}
        </button>
      </div>
    </>
  );
};

export default TimerCountdown;
