function TaskCard({ task, onToggle, onDelete, onEdit }) {
  const isDone = !!task.done;
  return (
    <div
      className={`bg-surface-container p-5 rounded-xl border border-outline-variant/50 flex items-center gap-5 hover:bg-surface-container-high hover:border-outline-variant transition-all group ${isDone ? "opacity-40" : ""}`}
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
        <h4
          className={`font-semibold text-on-surface group-hover:text-primary transition-colors ${isDone ? "line-through" : ""}`}
          onDoubleClick={() => onEdit(task)}
        >
          {task.text}
        </h4>
        {/* Example: time/category/location, can be customized as needed */}
        {task.time || task.category || task.location ? (
          <div className="flex items-center gap-4">
            {task.time && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">
                  schedule
                </span>
                {task.time}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">
                  category
                </span>
                {task.category}
              </span>
            )}
            {task.location && (
              <span className="flex items-center gap-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">
                  location_on
                </span>
                {task.location}
              </span>
            )}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 text-gray-400">
        <button
          onClick={() => onEdit(task)}
          className="hover:text-primary"
          aria-label="Edit task"
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="hover:text-error"
          aria-label="Delete task"
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
