const RECURRENCE_OPTIONS = [
  { value: "none",    label: "No repeat",  icon: "block" },
  { value: "daily",   label: "Daily",      icon: "today" },
  { value: "weekly",  label: "Weekly",     icon: "view_week" },
  { value: "monthly", label: "Monthly",    icon: "calendar_month" },
];

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
  // Recurrence (optional — omit to hide the section)
  recurrence,
  setRecurrence,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isRecurringInstance, // true when editing an existing recurring task instance
  title,
}) {
  if (!isOpen) return null;

  const showRecurrence = !!setRecurrence;
  const hasRepeat = recurrence && recurrence !== "none";

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-md p-7 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2 pr-8">
          {title}
        </h2>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Task description..."
          className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/60 text-on-surface placeholder:text-on-surface-variant/60"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Image URL (optional)"
          className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/60 text-on-surface placeholder:text-on-surface-variant/60"
        />
        <div className="flex items-center gap-3">
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

        {/* Recurrence section */}
        {showRecurrence && (
          <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
            {isRecurringInstance && (
              <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                Changes to the repeat pattern will apply to all future instances.
              </p>
            )}

            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">repeat</span>
              Repeat
            </span>

            {/* Frequency selector */}
            <div className="grid grid-cols-2 gap-2">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrence(opt.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    recurrence === opt.value
                      ? "bg-secondary text-on-secondary border-secondary"
                      : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Date range — shown only when a repeat mode is active */}
            {hasRepeat && (
              <div className="flex flex-col gap-2 bg-surface-container-low rounded-xl p-3 border border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-on-surface-variant w-10 flex-shrink-0">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-on-surface-variant w-10 flex-shrink-0">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
                    placeholder="No end date"
                  />
                  {endDate && (
                    <button
                      type="button"
                      onClick={() => setEndDate("")}
                      className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                      title="Remove end date"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {!endDate ? "Repeats indefinitely — set an end date to stop automatically." : ""}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave()}
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
