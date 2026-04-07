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
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl w-[90%] max-w-md p-8 flex flex-col gap-6">
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
          className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full border border-outline-variant/30 bg-surface-container-lowest rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/60"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all"
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
