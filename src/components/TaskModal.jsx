function TaskModal({
  isOpen,
  onClose,
  onSave,
  text,
  setText,
  image,
  setImage,
  priority,
  setPriority,
  title,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-[90%] max-w-md p-7 flex flex-col gap-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2">
          {title}
        </h2>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task description..."
          className="w-full border border-outline-variant/60 bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full border border-outline-variant/60 bg-surface-container-low rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface placeholder:text-on-surface-variant/50"
        />
        <div className="flex items-center gap-3 mb-2">
          <input
            id="priority-checkbox"
            type="checkbox"
            checked={priority}
            onChange={(e) => setPriority(e.target.checked)}
            className="accent-primary w-5 h-5 rounded focus:ring-2 focus:ring-primary"
          />
          <label
            htmlFor="priority-checkbox"
            className="text-on-surface font-medium cursor-pointer select-none"
          >
            Priority Task/Subject
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
