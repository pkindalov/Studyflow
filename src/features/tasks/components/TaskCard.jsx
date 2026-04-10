import { useState } from "react";
import { recurrenceLabel } from "../hooks/useRecurringTasks";

function TaskCard({ task, onToggle, onDelete, onEdit, onStopRecurring, selected = true, onToggleSelect, onOpenTimer, dragging, onDragStart, onDragEnter, onDragEnd, onDragOver }) {
  const isDone = !!task.done;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isRecurring = !!task.recurringId;

  return (
    <div
      draggable={!!(onDragStart)}
      onDragStart={onDragStart ? () => onDragStart(task.id) : undefined}
      onDragEnter={onDragEnter ? () => onDragEnter(task.id) : undefined}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`bg-surface-container p-3 sm:p-5 rounded-xl border flex items-center gap-2 sm:gap-5 hover:bg-surface-container-high transition-all group ${
        dragging ? "opacity-30" : ""
      } ${
        isDone ? "opacity-40" : ""
      } ${
        selected
          ? "border-outline-variant/50 hover:border-outline-variant"
          : "border-outline-variant/20 opacity-60"
      }`}
    >
      {onDragStart && (
        <span className="material-symbols-outlined text-base text-on-surface-variant/30 group-hover:text-on-surface-variant/60 cursor-grab active:cursor-grabbing flex-shrink-0 select-none">
          drag_indicator
        </span>
      )}
      <button
        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${isDone ? "border-primary bg-primary" : "border-outline-variant group-hover:border-primary"}`}
        onClick={() => onToggle(task.id)}
        aria-label={isDone ? "Mark as incomplete" : "Mark as complete"}
      >
        <span
          className="material-symbols-outlined text-white text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check
        </span>
      </button>

      {/* Image thumbnail if present */}
      {task.imageUrl && (
        <img
          src={task.imageUrl}
          alt="Task visual"
          className="w-12 h-12 rounded-xl object-cover border border-outline-variant/20 shadow-sm bg-white"
          style={{ minWidth: 48, minHeight: 48, maxWidth: 48, maxHeight: 48 }}
        />
      )}

      <div className="flex-grow flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={`font-semibold text-on-surface group-hover:text-primary transition-colors ${isDone ? "line-through" : ""}`}
            onDoubleClick={() => onEdit(task)}
          >
            {task.text}
          </h4>
          {task.recurringId && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5 flex-shrink-0"
              title={recurrenceLabel({ recurrence: task._recurrence }) || "Recurring task"}
            >
              <span className="material-symbols-outlined text-xs">repeat</span>
              Repeat
            </span>
          )}
        </div>
        {task.time || task.category || task.location ? (
          <div className="flex items-center gap-4">
            {task.time && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {task.time}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">category</span>
                {task.category}
              </span>
            )}
            {task.location && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {task.location}
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex gap-0.5 sm:gap-1 text-on-surface-variant flex-shrink-0 items-center">
        {/* Play timer button */}
        {onOpenTimer && (
          <button
            onClick={() => onOpenTimer(task)}
            className="p-1 sm:p-1.5 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Start timer"
            title="Start timer for this task"
          >
            <span className="material-symbols-outlined text-base">play_circle</span>
          </button>
        )}
        {/* Schedule inclusion toggle */}
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(task.id)}
            className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
              selected
                ? "text-secondary hover:bg-secondary/10"
                : "text-on-surface-variant/30 hover:bg-surface-container-high hover:text-on-surface-variant"
            }`}
            title={selected ? "Exclude from schedule" : "Include in schedule"}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ fontVariationSettings: selected ? "'FILL' 1" : "'FILL' 0" }}
            >
              event_available
            </span>
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="p-1 sm:p-1.5 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Edit task"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        {task.recurringId && onStopRecurring && (
          <button
            onClick={() => onStopRecurring(task.recurringId)}
            className="p-1 sm:p-1.5 rounded-lg hover:text-secondary hover:bg-secondary/10 transition-colors"
            aria-label="Stop repeating"
            title="Stop this task from repeating on future dates"
          >
            <span className="material-symbols-outlined text-base">repeat_off</span>
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1 sm:p-1.5 rounded-lg hover:text-error hover:bg-error/10 transition-colors"
          aria-label="Delete task"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">delete</span>
                Delete task?
              </h3>
              <p className="text-sm text-on-surface font-medium line-clamp-2">"{task.text}"</p>
              {isRecurring && (
                <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">info</span>
                  This is a recurring task — deleting it will remove all its instances.
                </p>
              )}
              <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2">
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(task.id); setShowDeleteConfirm(false); }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskCard;
