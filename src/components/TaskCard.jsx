import { recurrenceLabel } from "../hooks/useRecurringTasks";

function TaskCard({ task, onToggle, onDelete, onEdit, onStopRecurring, selected = true, onToggleSelect }) {
  const isDone = !!task.done;
  return (
    <div
      className={`bg-surface-container p-5 rounded-xl border flex items-center gap-5 hover:bg-surface-container-high transition-all group ${
        isDone ? "opacity-40" : ""
      } ${
        selected
          ? "border-outline-variant/50 hover:border-outline-variant"
          : "border-outline-variant/20 opacity-60"
      }`}
    >
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

      <div className="flex gap-1 text-on-surface-variant flex-shrink-0 items-center">
        {/* Schedule inclusion toggle */}
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(task.id)}
            className={`p-1.5 rounded-lg transition-colors ${
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
          className="p-1.5 rounded-lg hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Edit task"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        {task.recurringId && onStopRecurring && (
          <button
            onClick={() => onStopRecurring(task.recurringId)}
            className="p-1.5 rounded-lg hover:text-secondary hover:bg-secondary/10 transition-colors"
            aria-label="Stop repeating"
            title="Stop this task from repeating on future dates"
          >
            <span className="material-symbols-outlined text-base">repeat_off</span>
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="p-1.5 rounded-lg hover:text-error hover:bg-error/10 transition-colors"
          aria-label="Delete task"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
