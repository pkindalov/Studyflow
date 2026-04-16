import { useLang } from "../../../shared/i18n/LangContext";

function monthName(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

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
  monthsAhead,
  setMonthsAhead,
  yearsAhead,
  setYearsAhead,
  isRecurringInstance,
  // Move to date (edit mode, non-recurring only)
  moveToDate,
  setMoveToDate,
  title,
}) {
  const { t, lang } = useLang();

  if (!isOpen) return null;

  const locale = lang === "bg" ? "bg-BG" : "en-US";
  const showRecurrence = !!setRecurrence;
  const hasRepeat = recurrence && recurrence !== "none";

  const RECURRENCE_OPTIONS = [
    { value: "none",    label: t.noRepeat,  icon: "block" },
    { value: "daily",   label: t.daily,     icon: "today" },
    { value: "monthly", label: t.monthly,   icon: "calendar_month" },
    { value: "yearly",  label: t.yearly,    icon: "event_repeat" },
    { value: "custom",  label: t.custom,    icon: "date_range" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-7 flex flex-col gap-5 max-h-[92dvh] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
          aria-label={t.close}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2 pr-8">
          {title}
        </h2>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.taskDescPlaceholder}
          rows={3}
          className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/60 text-on-surface placeholder:text-on-surface-variant/60 resize-none"
        />
        <input
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder={t.imageUrlPlaceholder}
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
            {t.priorityTaskLabel}
          </label>
        </div>

        {/* Recurrence section */}
        {showRecurrence && (
          <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
            {isRecurringInstance && (
              <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">info</span>
                {t.recurringChangeNote}
              </p>
            )}

            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">repeat</span>
              {t.repeatLabel}
            </span>

            {/* Frequency selector */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {RECURRENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecurrence(opt.value)}
                  className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-sm font-semibold border transition-all ${
                    recurrence === opt.value
                      ? "bg-secondary text-on-secondary border-secondary"
                      : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{opt.icon}</span>
                  <span className="leading-tight text-center">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Per-mode sub-UI */}
            {hasRepeat && (
              <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40 flex flex-col gap-2">

                {/* DAILY — auto end of month, no input needed */}
                {recurrence === "daily" && (
                  <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-secondary">info</span>
                    {t.repeatsEveryDayUntil(monthName(startDate, locale))}
                  </p>
                )}

                {/* MONTHLY — number of months ahead */}
                {recurrence === "monthly" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                      {t.repeatForNext}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={monthsAhead}
                      onChange={(e) => setMonthsAhead(e.target.value)}
                      className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                    <span className="text-xs font-semibold text-on-surface-variant">{t.months}</span>
                  </div>
                )}

                {/* YEARLY — number of years ahead */}
                {recurrence === "yearly" && (
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                      {t.repeatForNext}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={yearsAhead}
                      onChange={(e) => setYearsAhead(e.target.value)}
                      className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50"
                    />
                    <span className="text-xs font-semibold text-on-surface-variant">{t.years}</span>
                  </div>
                )}

                {/* CUSTOM — manual from/to date pickers */}
                {recurrence === "custom" && (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-on-surface-variant w-10 flex-shrink-0">
                        {t.fromDate}
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
                        {t.toDate}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
                      />
                      {endDate && (
                        <button
                          type="button"
                          onClick={() => setEndDate("")}
                          className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                          title={t.removeEndDate}
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                    {!endDate && (
                      <p className="text-[10px] text-on-surface-variant">
                        {t.repeatsDailyNoEnd}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Move to date — only for non-recurring tasks in edit mode */}
        {setMoveToDate && (
          <div className="flex flex-col gap-2 border-t border-outline-variant/30 pt-4">
            <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">drive_file_move</span>
              {t.moveToDate}
            </span>
            <input
              type="date"
              value={moveToDate}
              onChange={(e) => setMoveToDate(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/60 [color-scheme:dark]"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onSave()}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-sm hover:opacity-90 transition-all"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
