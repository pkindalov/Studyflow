import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ScheduleItem = function({ task, elapsed, isRunning, onOpenTimer, onMarkDone, onRemove, t }) {
  const total = task.scheduledMinutes * 60;
  const isFinished = task.done || (total > 0 && elapsed >= total);
  const hasProgress = elapsed > 0 && !isFinished;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  // @dnd-kit requires inline transform/transition for drag animation — not expressible as Tailwind classes
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-4 p-3 rounded-xl border overflow-hidden transition-opacity ${isDragging ? "opacity-30" : ""} ${task.priority ? "bg-tertiary/10 border-tertiary/30" : "bg-surface-container-low border-outline-variant/50"}`}
    >
      {(hasProgress || isFinished) && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(isFinished ? 100 : Math.min(100, (elapsed / total) * 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-outline-variant/30"
        >
          {/* width is a runtime %, not expressible as a static Tailwind class */}
          <div
            className={`h-full transition-all ${isFinished ? "bg-tertiary" : "bg-primary"}`}
            style={{ width: `${isFinished ? 100 : Math.min(100, (elapsed / total) * 100)}%` }}
          />
        </div>
      )}
      <span
        className="material-symbols-outlined text-base text-on-surface-variant/40 flex-shrink-0 select-none cursor-grab active:cursor-grabbing hover:text-on-surface-variant/70 transition-colors touch-none"
        {...attributes}
        {...listeners}
      >drag_indicator</span>
      <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${task.priority ? "bg-tertiary" : "bg-on-surface-variant"}`} />
      <span className="flex-1 font-medium text-on-surface text-sm">{task.text}</span>
      <span className="text-xs text-on-surface-variant font-mono">{task.scheduledMinutes} {t.minUnit}</span>
      {task.priority && (
        <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase ml-1">{t.priorityBadge}</span>
      )}
      <button
        onClick={() => onOpenTimer(task)}
        title={isFinished ? t.completedStatus : isRunning ? t.runningStatus : hasProgress ? t.resumeTimerStatus : t.startTimerStatus}
        aria-label={isFinished ? t.completedStatus : isRunning ? t.runningStatus : hasProgress ? t.resumeTimerStatus : t.startTimerStatus}
        className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all flex-shrink-0 ${
          isFinished
            ? "bg-tertiary/20 text-tertiary"
            : isRunning
              ? "bg-primary/20 text-primary motion-safe:animate-pulse"
              : hasProgress
                ? "bg-secondary/20 text-secondary hover:bg-secondary/30"
                : "bg-on-surface-variant/10 text-on-surface-variant hover:bg-on-surface-variant/20"
        }`}
      >
        <span className="material-symbols-outlined text-base">
          {isFinished ? "check_circle" : isRunning ? "pause_circle" : "play_circle"}
        </span>
      </button>
      {!isFinished && (
        <button
          onClick={() => onMarkDone(task.id)}
          title={t.markDoneEarly}
          aria-label={t.markDoneEarly}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all flex-shrink-0 text-on-surface-variant/40 hover:text-tertiary hover:bg-tertiary/10"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
        </button>
      )}
      <button
        onClick={() => onRemove(task.id)}
        title={t.removeFromSchedule}
        aria-label={t.removeFromSchedule}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full transition-all flex-shrink-0 text-on-surface-variant/40 hover:text-error hover:bg-error/10"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </li>
  );
};

export default ScheduleItem;
