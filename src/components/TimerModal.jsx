import React from "react";

function TimerModal({ task, elapsedSeconds, isRunning, onPlayPause, onClose }) {
  const totalSeconds = task.scheduledMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const isFinished = remaining === 0 && totalSeconds > 0;

  const remMin = Math.floor(remaining / 60);
  const remSec = remaining % 60;
  const elMin = Math.floor(elapsedSeconds / 60);
  const elSec = elapsedSeconds % 60;

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
                  {String(remMin).padStart(2, "0")}:{String(remSec).padStart(2, "0")}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">
                  remaining
                </span>
              </>
            )}
          </div>
        </div>

        {/* Elapsed / total */}
        <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">timer</span>
          <span className="font-mono text-on-surface">
            {String(elMin).padStart(2, "0")}:{String(elSec).padStart(2, "0")}
          </span>
          <span>/</span>
          <span className="font-mono">
            {String(task.scheduledMinutes).padStart(2, "0")}:00
          </span>
          <span className="ml-1">elapsed</span>
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
      </div>
    </div>
  );
}

export default TimerModal;
