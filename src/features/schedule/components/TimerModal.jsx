import { useState } from "react";

function formatTime(seconds, hms) {
  if (hms) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function TimerModal({ task, elapsedSeconds, isRunning, onPlayPause, onClose, music,
  pomodoroEnabled, setPomodoroEnabled, pomodoroMinutes, setPomodoroMinutes, pomodoroResetAt = 0 }) {
  const [hmsMode, setHmsMode] = useState(false);

  const totalSeconds = task.scheduledMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const isFinished = remaining === 0 && totalSeconds > 0;


  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Task name */}
        <div className="text-center w-full px-8">
          <h2 className="text-lg font-headline font-bold text-on-surface leading-tight line-clamp-2">
            {task.text}
          </h2>
          {task.priority && (
            <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase mt-1 block">
              Priority
            </span>
          )}
        </div>

        {/* Circular countdown */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 200 200">
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-surface-container-high"
            />
            {/* Progress arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={
                isFinished
                  ? "text-tertiary"
                  : isRunning
                    ? "text-primary"
                    : "text-secondary"
              }
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>

          {/* Center content */}
          <div className="relative flex flex-col items-center justify-center select-none">
            {isFinished ? (
              <div className="flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-tertiary text-5xl">
                  check_circle
                </span>
                <span className="text-tertiary font-bold text-sm">Done!</span>
              </div>
            ) : (
              <>
                <span className="text-3xl font-mono font-bold text-on-surface tabular-nums">
                  {formatTime(remaining, hmsMode)}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">
                  remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Elapsed / total + format toggle */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">timer</span>
            <span className="font-mono text-on-surface">
              {formatTime(elapsedSeconds, hmsMode)}
            </span>
            <span>/</span>
            <span className="font-mono">
              {formatTime(totalSeconds, hmsMode)}
            </span>
            <span className="ml-1">elapsed</span>
          </div>
          <button
            onClick={() => setHmsMode((v) => !v)}
            className="text-[10px] font-semibold tracking-wider uppercase text-on-surface-variant/60 hover:text-on-surface-variant border border-outline-variant/30 hover:border-outline-variant/60 rounded-full px-2.5 py-0.5 transition-all"
            title="Toggle time format"
          >
            {hmsMode ? "MM:SS" : "HH:MM:SS"}
          </button>
        </div>

        {/* Play / Pause button */}
        {isFinished ? (
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            Close
          </button>
        ) : (
          <button
            onClick={onPlayPause}
            className={`flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all active:scale-95 ${
              isRunning
                ? "bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/40"
                : "bg-primary hover:opacity-90"
            }`}
          >
            <span
              className={`material-symbols-outlined text-4xl ${isRunning ? "text-on-surface" : "text-on-primary"}`}
            >
              {isRunning ? "pause" : "play_arrow"}
            </span>
          </button>
        )}

        {/* Status hint */}
        <p className="text-xs text-on-surface-variant text-center">
          {isFinished
            ? "Task time completed! Great work."
            : isRunning
              ? "Timer running — close to pause and save progress"
              : elapsedSeconds > 0
                ? "Paused — progress saved automatically"
                : "Press play to start the countdown"}
        </p>

        {/* Pomodoro controls */}
        {setPomodoroEnabled && (
          <div className="w-full border-t border-outline-variant/30 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-error/70">timer</span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex-1">
                Pomodoro
              </span>
              <button
                onClick={() => setPomodoroEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  pomodoroEnabled ? "bg-error/70" : "bg-outline-variant/50"
                }`}
                title={pomodoroEnabled ? "Disable Pomodoro" : "Enable Pomodoro"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    pomodoroEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {pomodoroEnabled && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-on-surface-variant flex-1">
                    Break every
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={pomodoroMinutes}
                    onChange={(e) => setPomodoroMinutes(Math.max(1, Math.min(60, Number(e.target.value))))}
                    className="w-14 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-error/40"
                  />
                  <span className="text-xs text-on-surface-variant">min</span>
                </div>

                {elapsedSeconds > 0 && (() => {
                  const pomSec = pomodoroMinutes * 60;
                  const elapsedInPom = Math.max(0, elapsedSeconds - pomodoroResetAt);
                  const cycle = Math.floor(elapsedInPom / pomSec) + 1;
                  const timeInCycle = elapsedInPom % pomSec;
                  const untilBreak = pomSec - timeInCycle;
                  return (
                    <div className="flex items-center justify-between bg-error/8 border border-error/20 rounded-lg px-3 py-1.5">
                      <span className="text-xs text-error/80 font-semibold">
                        Cycle {cycle}
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {isRunning
                          ? `break in ${formatTime(untilBreak, false)}`
                          : timeInCycle === 0
                            ? "Take a break!"
                            : `paused · ${formatTime(untilBreak, false)} left`}
                      </span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Music controls */}
        {music && (
          <div className="w-full border-t border-outline-variant/30 pt-4 flex flex-col gap-2">
            {/* Header + play-pause */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-tertiary">
                headphones
              </span>
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex-1">
                Music
              </span>
              {music.activeTrack && (
                <button
                  onClick={music.togglePlay}
                  className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
                    music.isPlaying
                      ? "bg-tertiary/20 text-tertiary hover:bg-tertiary/30"
                      : "bg-tertiary text-on-tertiary hover:opacity-90"
                  }`}
                  title={music.isPlaying ? "Pause music" : "Play music"}
                >
                  <span className="material-symbols-outlined text-sm">
                    {music.isPlaying ? "pause" : "play_arrow"}
                  </span>
                </button>
              )}
            </div>

            {/* Track list */}
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
              {music.playlist.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-2">
                  No tracks — add one in the sidebar.
                </p>
              )}
              {music.playlist.map((track) => {
                const isActive = track.id === music.activeTrackId;
                return (
                  <button
                    key={track.id}
                    onClick={() => music.selectTrack(track.id)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-tertiary/15 border border-tertiary/30"
                        : "hover:bg-surface-container-high border border-transparent"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm flex-shrink-0 ${
                        isActive && music.isPlaying
                          ? "text-tertiary"
                          : isActive
                            ? "text-tertiary/60"
                            : "text-on-surface-variant/30"
                      }`}
                    >
                      {isActive && music.isPlaying
                        ? "radio_button_checked"
                        : "radio_button_unchecked"}
                    </span>
                    <span
                      className={`text-xs truncate font-medium ${
                        isActive ? "text-on-surface" : "text-on-surface-variant"
                      }`}
                    >
                      {track.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimerModal;
