function TaskCard({ task, onToggle, onDelete, onEdit }) {
  return (
    <li className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition">
      <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
        {task.imageUrl ? (
          <img
            src={task.imageUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-3xl">📌</span>
        )}
      </div>

      <div className="p-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task.id)}
          className="mt-1 accent-gray-900"
        />

        <div className="flex-1">
          <span
            onDoubleClick={() => onEdit(task)}
            className={`text-sm cursor-pointer ${
              task.done ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {task.text}
          </span>
        </div>

        <div className="flex gap-2 text-gray-400">
          <button onClick={() => onEdit(task)} className="hover:text-gray-700">
            ✎
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  );
}

export default TaskCard;
