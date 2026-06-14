import { useLang } from "../../../shared/i18n/LangContext";
import TimerCountdown from "./TimerCountdown";
import PomodoroPanel from "./PomodoroPanel";
import MusicPanel from "./MusicPanel";

function TimerModal({ task, elapsedSeconds, isRunning, onPlayPause, onClose, onRestart, onStartAgain, onMarkDone, onMinimize, music,
  pomodoroEnabled, setPomodoroEnabled, pomodoroMinutes, setPomodoroMinutes, pomodoroResetAt = 0, pomodoroBreakCount = 0 }) {
  const { t } = useLang();
  const totalSeconds = task.scheduledMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const isFinished = remaining === 0 && totalSeconds > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="timer-modal-title" className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5">

        <div className="absolute top-4 right-4 flex items-center gap-1">
          {onMinimize && (
            <button onClick={onMinimize} className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all" aria-label={t.minimize} title={t.minimize}>
              <span className="material-symbols-outlined text-xl">minimize</span>
            </button>
          )}
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all" aria-label={t.close}>
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="text-center w-full px-8">
          <h2 id="timer-modal-title" className="text-lg font-headline font-bold text-on-surface leading-tight line-clamp-2">{task.text}</h2>
          {task.priority && (
            <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase mt-1 block">{t.priorityBadge}</span>
          )}
        </div>

        <TimerCountdown
          remaining={remaining} totalSeconds={totalSeconds}
          elapsedSeconds={elapsedSeconds} isRunning={isRunning} isFinished={isFinished}
        />

        {isFinished ? (
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 w-full">
              {onStartAgain && (
                <button onClick={onStartAgain} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-all">
                  <span className="material-symbols-outlined text-base">replay</span>
                  {t.startAgain}
                </button>
              )}
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-outline-variant/50 text-on-surface-variant rounded-xl font-semibold hover:bg-surface-container-high transition-all">
                {t.close}
              </button>
            </div>
            {onRestart && (
              <button onClick={onRestart} className="w-full flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs text-on-surface-variant/60 hover:text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                {t.restart}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={onPlayPause}
              aria-label={isRunning ? t.pauseTimerTitle : t.playTimerTitle}
              className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all active:scale-95 ${isRunning ? "bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40" : "bg-primary hover:opacity-90"}`}
            >
              <span className={`material-symbols-outlined text-4xl ${isRunning ? "text-on-surface" : "text-on-primary"}`}>{isRunning ? "pause" : "play_arrow"}</span>
            </button>
            {onMarkDone && (
              <button onClick={onMarkDone} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-tertiary border border-tertiary/30 hover:bg-tertiary/10 transition-all">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {t.markDoneEarly}
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-on-surface-variant text-center">
          {isFinished ? t.taskCompletedMsg : isRunning ? t.timerRunningHint : elapsedSeconds > 0 ? t.timerPausedHint : t.timerReadyHint}
        </p>

        {setPomodoroEnabled && (
          <PomodoroPanel
            pomodoroEnabled={pomodoroEnabled} setPomodoroEnabled={setPomodoroEnabled}
            pomodoroMinutes={pomodoroMinutes} setPomodoroMinutes={setPomodoroMinutes}
            pomodoroResetAt={pomodoroResetAt} pomodoroBreakCount={pomodoroBreakCount}
            elapsedSeconds={elapsedSeconds} isRunning={isRunning}
          />
        )}

        {music && <MusicPanel music={music} />}
      </div>
    </div>
  );
}

export default TimerModal;
