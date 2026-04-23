import { useLang } from "../../../shared/i18n/LangContext";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function MinimizedTimer({ task, elapsedSeconds, isRunning, onExpand, onPlayPause }) {
  const { t } = useLang();
  const totalSeconds = task.scheduledMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const isFinished = remaining === 0 && totalSeconds > 0;

  const progress = totalSeconds > 0 ? (1 - remaining / totalSeconds) : 0;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-surface-container border border-outline-variant/60 shadow-[0_8px_32px_rgba(0,0,0,0.45)] rounded-2xl px-3 py-2 backdrop-blur-sm">
        {/* Mini circular progress + play/pause */}
        <button
          onClick={onPlayPause}
          disabled={isFinished}
          className={`relative flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 transition-all active:scale-95 ${
            isFinished
              ? "bg-tertiary/20 cursor-default"
              : isRunning
                ? "bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40"
                : "bg-primary hover:opacity-90"
          }`}
          title={isRunning ? t.pauseTimerTitle : t.playTimerTitle}
        >
          <svg className="absolute inset-0" viewBox="0 0 30 30">
            <circle
              cx="15" cy="15" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={isFinished ? "text-tertiary/30" : "text-outline-variant/30"}
            />
            <circle
              cx="15" cy="15" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={isFinished ? "text-tertiary" : isRunning ? "text-primary" : "text-secondary"}
              transform="rotate(-90 15 15)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <span className={`material-symbols-outlined text-base relative z-10 ${
            isFinished ? "text-tertiary" : isRunning ? "text-on-surface" : "text-on-primary"
          }`}>
            {isFinished ? "check_circle" : isRunning ? "pause" : "play_arrow"}
          </span>
        </button>

        {/* Task name + countdown — click to expand */}
        <button
          onClick={onExpand}
          className="flex items-center gap-2.5 min-w-0 group"
          title={t.expandTimer}
        >
          <span className="text-sm font-semibold text-on-surface truncate max-w-[140px] sm:max-w-[200px]">
            {task.text}
          </span>
          <span className={`text-sm font-mono font-bold tabular-nums flex-shrink-0 ${
            isFinished ? "text-tertiary" : isRunning ? "text-primary" : "text-on-surface-variant"
          }`}>
            {isFinished ? t.timerDone : formatTime(remaining)}
          </span>
        </button>

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="flex items-center justify-center w-7 h-7 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all flex-shrink-0"
          title={t.expandTimer}
        >
          <span className="material-symbols-outlined text-lg">open_in_full</span>
        </button>
      </div>
    </div>
  );
}

export default MinimizedTimer;
