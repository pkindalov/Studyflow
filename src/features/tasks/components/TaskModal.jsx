import { useState, useEffect, useRef } from "react";
import { useLang } from "../../../shared/i18n/LangContext";
import RecurrenceSection from "./RecurrenceSection";

const MoveToDateSection = function({ moveToDate, setMoveToDate, t }) {
  const today = new Date().toLocaleDateString("en-CA");
  return (
    <div className="flex flex-col gap-2 border-t border-outline-variant/30 pt-4">
      <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
        <span className="material-symbols-outlined text-base">drive_file_move</span>
        {t.moveToDate}
      </span>
      <input
        type="date"
        value={moveToDate}
        min={today}
        onChange={(e) => setMoveToDate(e.target.value)}
        className="w-full bg-surface-container-highest border border-outline/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </div>
  );
};

const TaskModal = function({
  isOpen,
  onClose,
  onSave,
  text,
  setText,
  image,
  setImage,
  priority,
  setPriority,
  recurrence,
  handleSetRecurrence,
  dateMode,
  handleSetDateMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  monthsAhead,
  setMonthsAhead,
  yearsAhead,
  setYearsAhead,
  isRecurringInstance,
  moveToDate,
  setMoveToDate,
  taskDate,
  title,
}) {
  const { t } = useLang();
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [showImageInput, setShowImageInput] = useState(image !== undefined && image !== null && image !== "");

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      const id = setTimeout(() => panelRef.current?.querySelector("textarea")?.focus(), 0);
      return () => clearTimeout(id);
    }
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    }
    previousFocusRef.current = null;
  }, [isOpen]);

  if (!isOpen) return null;

  const showRecurrence = !!handleSetRecurrence;
  const trimmedText = text.trim();
  const saveDisabled = !trimmedText || (dateMode === "range" && !endDate);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(panelRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        ref={panelRef}
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (!saveDisabled) onSave(); }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md pt-5 sm:pt-7 px-5 sm:px-7 flex flex-col gap-5 max-h-dvh sm:max-h-[92dvh] overflow-y-auto overscroll-contain"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
          aria-label={t.close}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <h2 className="text-2xl font-headline font-bold text-on-surface mb-2 pr-8">{title}</h2>

        <label className="sr-only" htmlFor="task-desc">{t.taskDescPlaceholder}</label>
        <textarea
          id="task-desc"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.taskDescPlaceholder}
          rows={3}
          maxLength={200}
          className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/60 text-on-surface placeholder:text-on-surface-variant/60 resize-none"
        />
        {text.length > 150 && (
          <p className="text-right text-[11px] text-on-surface-variant/50 -mt-3">
            {text.length}/200
          </p>
        )}

        {!showImageInput ? (
          <button
            type="button"
            onClick={() => setShowImageInput(true)}
            className="text-sm text-on-surface-variant/70 hover:text-primary flex items-center gap-1.5 transition-colors self-start"
          >
            <span className="material-symbols-outlined text-base">add_photo_alternate</span>
            {t.addImageUrl}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {image && (
              <img src={image} alt="" className="w-12 h-12 rounded-xl object-cover border border-outline-variant/20 flex-shrink-0 bg-surface-container-high" onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <div className="flex-1">
              <label className="sr-only" htmlFor="task-image">{t.imageUrlPlaceholder}</label>
              <input
                id="task-image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder={t.imageUrlPlaceholder}
                autoFocus={!image}
                className="w-full border border-outline/60 bg-surface-container-highest rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/60 text-on-surface placeholder:text-on-surface-variant/60"
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowImageInput(false); setImage(""); }}
              className="p-2 rounded-xl text-on-surface-variant/50 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
              aria-label={t.close}
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            id="priority-checkbox"
            type="checkbox"
            checked={priority}
            onChange={(e) => setPriority(e.target.checked)}
            className="accent-primary w-5 h-5 rounded focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="priority-checkbox" className="text-on-surface font-medium cursor-pointer select-none">
            {t.priorityTaskLabel}
          </label>
        </div>

        {showRecurrence && (
          <RecurrenceSection
            recurrence={recurrence}
            setRecurrence={handleSetRecurrence}
            dateMode={dateMode}
            setDateMode={handleSetDateMode}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            monthsAhead={monthsAhead}
            setMonthsAhead={setMonthsAhead}
            yearsAhead={yearsAhead}
            setYearsAhead={setYearsAhead}
            isRecurringInstance={isRecurringInstance}
            taskDate={taskDate}
          />
        )}

        {setMoveToDate && (
          <MoveToDateSection moveToDate={moveToDate} setMoveToDate={setMoveToDate} t={t} />
        )}

        <div className="sticky bottom-0 bg-surface-container z-10 border-t border-outline-variant/20 -mx-5 sm:-mx-7 px-5 sm:px-7 pb-5 sm:pb-7 pt-3 flex flex-col gap-2">
          {dateMode === "range" && !endDate && (
            <p className="text-xs text-amber-600 text-right">{t.periodEndDateRequired}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saveDisabled}
              className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold shadow-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.save}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default TaskModal;
