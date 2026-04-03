function TaskModal({
  isOpen,
  onClose,
  onSave,
  text,
  setText,
  image,
  setImage,
  title,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task description..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
