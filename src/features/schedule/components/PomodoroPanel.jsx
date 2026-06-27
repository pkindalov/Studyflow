import { useLang } from "../../../shared/i18n/LangContext";

const formatMmSs = function(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const PomodoroPanel = function({
  pomodoroEnabled, setPomodoroEnabled,
  pomodoroMinutes, setPomodoroMinutes,
  pomodoroResetAt, pomodoroBreakCount,
  elapsedSeconds, isRunning,
}) {
  const { t } = useLang();
  const pomodoroSec = Math.max(1, pomodoroMinutes) * 60;
  const pomodoroCycle = pomodoroBreakCount + 1;
  const pomodoroTimeInCycle = Math.max(0, elapsedSeconds - pomodoroResetAt) % pomodoroSec;
  const pomodoroUntilBreak = pomodoroSec - pomodoroTimeInCycle;

  return (
    <div className="w-full border-t border-outline-variant/30 pt-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-primary">timer</span>
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex-1">{t.pomodoroLabel}</span>
        <button
          onClick={() => setPomodoroEnabled((v) => !v)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${pomodoroEnabled ? "bg-primary" : "bg-outline-variant/50"}`}
          title={pomodoroEnabled ? t.disablePomodoro : t.enablePomodoro}
          aria-label={pomodoroEnabled ? t.disablePomodoro : t.enablePomodoro}
        >
          <span aria-hidden="true" className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pomodoroEnabled ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>
      {pomodoroEnabled && (
        <>
          <div className="flex items-center gap-2">
            <label htmlFor="pomodoro-minutes" className="text-xs text-on-surface-variant flex-1">{t.breakEvery}</label>
            <input
              id="pomodoro-minutes"
              type="number" min="1" max="60" value={pomodoroMinutes}
              onChange={(e) => setPomodoroMinutes(Math.max(1, Math.min(60, Number(e.target.value))))}
              className="w-14 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="text-xs text-on-surface-variant">{t.minUnit}</span>
          </div>
          {elapsedSeconds > 0 && (
            <div className="flex items-center justify-between bg-error/8 border border-error/20 rounded-lg px-3 py-1.5">
              <span className="text-xs text-error/80 font-semibold">{t.cycleLabel} {pomodoroCycle}</span>
              <span className="text-xs text-on-surface-variant font-mono">
                {isRunning
                  ? `${t.breakIn} ${formatMmSs(pomodoroUntilBreak)}`
                  : pomodoroTimeInCycle === 0
                    ? t.takeBreak
                    : t.pausedLeft(formatMmSs(pomodoroUntilBreak))}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PomodoroPanel;
