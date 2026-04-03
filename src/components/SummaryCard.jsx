function SummaryCard({ total, completed, remaining, progress, onAddClick }) {
  return (
    <div className="mb-6 p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <button
          onClick={onAddClick}
          className="w-full md:w-auto bg-gray-900 text-white px-5 py-2 rounded-xl hover:bg-black transition shadow-sm"
        >
          + Add Task
        </button>

        <span className="text-sm text-gray-500 font-medium">
          {progress}% completed
        </span>
      </div>

      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gray-900 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>📊 {total} total</span>
        <span>✅ {completed}</span>
        <span>⏳ {remaining}</span>
      </div>
    </div>
  );
}

export default SummaryCard;
