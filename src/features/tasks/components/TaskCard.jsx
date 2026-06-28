import { useState, useEffect, useRef, useId } from "react";
import { useLang } from "../../../shared/i18n/LangContext";
import useFocusTrap from "../../../shared/hooks/useFocusTrap";

const DeleteConfirmDialog = function({ task, onCancel, onConfirm }) {
  const { t } = useLang();
  const panelRef = useRef(null);
  const titleId = useId();
  const handleKeyDown = useFocusTrap(panelRef, { onEscape: onCancel });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <h3 id={titleId} className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">delete</span>
            {t.deleteTaskConfirm}
          </h3>
          <p className="text-sm text-on-surface font-medium line-clamp-2">"{task.text}"</p>
          {task.recurringId && (
            <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">info</span>
              {t.deleteRecurringWarning}
            </p>
          )}
          <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2">
            {t.cannotUndo}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskCard = function({ task, onToggle, onDelete, onEdit, onStopRecurring, selected = true, onToggleSelect, onOpenTimer, onSaveToBank, isInList = false, dragging, dragHandleListeners, dragHandleAttributes, scheduledMinutes }) {
  const { t } = useLang();
  const isDone = task.done === true;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const moreWrapRef = useRef(null);
  const menuRef = useRef(null);

  const menuActions = [];
  if (onSaveToBank) {
    menuActions.push({
      key: "save-to-list",
      onClick: () => { onSaveToBank(task); setShowMore(false); },
      icon: "bookmark",
      iconStateClass: isInList ? "icon-filled" : "icon-outlined",
      textClass: isInList ? "text-secondary" : "text-on-surface-variant",
      label: isInList ? t.removeFromList : t.saveToListAction,
    });
  }
  if (onToggleSelect) {
    menuActions.push({
      key: "toggle-select",
      onClick: () => { onToggleSelect(task.id); setShowMore(false); },
      icon: "event_available",
      iconStateClass: selected ? "icon-filled" : "icon-outlined",
      textClass: selected ? "text-secondary" : "text-on-surface-variant/60",
      label: selected ? t.excludeFromSchedule : t.includeInSchedule,
    });
  }
  if (task.recurringId && onStopRecurring) {
    menuActions.push({
      key: "stop-recurring",
      onClick: () => { onStopRecurring(task.recurringId); setShowMore(false); },
      icon: "repeat_off",
      iconStateClass: "",
      textClass: "text-on-surface-variant",
      label: t.stopRepeatingTitle,
    });
  }
  const hasSecondary = menuActions.length > 0;

  useEffect(() => {
    if (!showMore) return;
    const close = (e) => {
      if (!moreWrapRef.current?.contains(e.target)) setShowMore(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setShowMore(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showMore]);

  // Move focus to the first item when the menu opens, matching the ARIA menu pattern.
  // The active index is reset to 0 in the toggle handler, so focus and tabIndex stay in sync.
  useEffect(() => {
    if (!showMore) return;
    const firstItem = menuRef.current?.querySelector('[role="menuitem"]');
    firstItem?.focus();
  }, [showMore]);

  // Roving focus across menu items: Up/Down cycle, Home/End jump to ends.
  // The active item carries tabIndex 0 and the rest -1, so Tab leaves the menu.
  const handleMenuKeyDown = (event) => {
    const navigationKeys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!navigationKeys.includes(event.key)) return;

    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? []);
    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex;
    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % items.length;
    } else {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    }
    setActiveMenuIndex(nextIndex);
    items[nextIndex].focus();
  };

  return (
    <div
      className={`relative p-3 sm:p-5 rounded-xl border flex items-center gap-2 sm:gap-5 transition-all group ${
        dragging ? "opacity-30" : ""
      } ${
        isDone ? "opacity-40" : ""
      } ${
        task.priority
          ? "bg-tertiary/10 hover:bg-tertiary/15"
          : "bg-surface-container hover:bg-surface-container-high"
      } ${
        selected
          ? task.priority ? "border-tertiary/30 hover:border-tertiary/50" : "border-outline-variant/50 hover:border-outline-variant"
          : "border-outline-variant/20 opacity-60"
      }`}
    >
      {dragHandleListeners && (
        <span
          className="material-symbols-outlined text-base text-on-surface-variant/30 group-hover:text-on-surface-variant/60 cursor-grab active:cursor-grabbing flex-shrink-0 select-none touch-none"
          {...dragHandleAttributes}
          {...dragHandleListeners}
        >
          drag_indicator
        </span>
      )}
      <button
        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${isDone ? "border-primary bg-primary" : "border-outline-variant group-hover:border-primary"}`}
        onClick={() => onToggle(task.id)}
        aria-label={isDone ? t.markIncomplete : t.markComplete}
      >
        <span className="material-symbols-outlined text-white text-sm icon-filled">
          check
        </span>
      </button>

      {task.imageUrl && (
        <img
          src={task.imageUrl}
          alt={t.taskVisualAlt}
          className="w-12 h-12 flex-shrink-0 rounded-xl object-cover border border-outline-variant/20 shadow-sm bg-white"
        />
      )}

      <div className="flex-grow flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className={`font-semibold text-on-surface group-hover:text-primary transition-colors ${isDone ? "line-through" : ""}`}
          >
            {task.text}
          </h4>
          {task.recurringId && (
            <span
              className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5 flex-shrink-0"
              title={t.recurringTaskTitle}
            >
              <span className="material-symbols-outlined text-xs">repeat</span>
              {t.repeatBadge}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 sm:gap-1 text-on-surface-variant flex-shrink-0 items-center">
        {onOpenTimer && (
          <button
            onClick={() => onOpenTimer(task)}
            className="p-1 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center gap-0.5 rounded-xl hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label={t.startTimerAria}
            title={t.startTimerTitle}
          >
            <span className="material-symbols-outlined text-base">
              {scheduledMinutes > 0 ? "schedule" : "play_circle"}
            </span>
            {scheduledMinutes > 0 && (
              <span className="text-[10px] font-bold leading-none">{scheduledMinutes}m</span>
            )}
          </button>
        )}
        <button
          onClick={() => onEdit(task)}
          className="p-1 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label={t.editTaskAria}
        >
          <span className="material-symbols-outlined text-base">edit</span>
        </button>
        {hasSecondary && (
          <div ref={moreWrapRef} className="relative">
            <button
              onClick={() => { setShowMore((isVisible) => !isVisible); setActiveMenuIndex(0); }}
              className={`p-1 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors ${showMore ? "text-primary bg-primary/10" : "hover:text-primary hover:bg-primary/10"}`}
              aria-label={t.moreActionsAria}
              aria-haspopup="menu"
              aria-expanded={showMore}
            >
              <span className="material-symbols-outlined text-base">more_horiz</span>
            </button>
            {showMore && (
              <div
                ref={menuRef}
                role="menu"
                onKeyDown={handleMenuKeyDown}
                className="absolute right-0 top-full mt-1 z-30 bg-surface-container-highest border border-outline-variant/50 rounded-xl shadow-xl py-1 flex flex-col min-w-[180px]"
              >
                {menuActions.map((action, index) => (
                  <button
                    key={action.key}
                    role="menuitem"
                    tabIndex={index === activeMenuIndex ? 0 : -1}
                    onClick={action.onClick}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container-high ${action.textClass}`}
                  >
                    <span className={`material-symbols-outlined text-base flex-shrink-0 ${action.iconStateClass}`}>{action.icon}</span>
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1 sm:p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:text-error hover:bg-error/10 transition-colors"
          aria-label={t.deleteTaskAria}
        >
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          task={task}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => { onDelete(task.id); setShowDeleteConfirm(false); }}
        />
      )}
    </div>
  );
}

export default TaskCard;
