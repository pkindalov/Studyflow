import { useState, useMemo } from "react";
import { useLang } from "../../../shared/i18n/LangContext";
import TaskBankListTab from "./TaskBankListTab";
import TaskBankDateTab from "./TaskBankDateTab";

const TABS = [
  { key: "list", icon: "bookmarks",     labelKey: "savedListTab" },
  { key: "date", icon: "calendar_today", labelKey: "importFromDateTab" },
];

const TaskBankModal = function({ taskBank, tasks, onConfirm, onClose, onRemoveFromBank, onAddToBank, onUpdateInBank, onReorderBank, withGenerate = false }) {
  const { t } = useLang();
  const [tab, setTab] = useState("list");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importDate, setImportDate] = useState("");

  const importDateTasks = useMemo(() => {
    if (!importDate) return [];
    return (tasks[importDate] || []).filter((task) => !task.done);
  }, [tasks, importDate]);

  const toggleId = function(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTabChange = function(next) {
    setTab(next);
    setSelectedIds(new Set());
  };

  const handleImportDateChange = function(value) {
    setImportDate(value);
    setSelectedIds(new Set());
  };

  const handleConfirm = function() {
    if (selectedIds.size === 0) return;
    const source = tab === "list" ? taskBank : importDateTasks;
    const selected = source.filter((task) => selectedIds.has(task.id));
    onConfirm(selected.map(({ text, priority, imageUrl }) => ({ text, priority, imageUrl })));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-md flex flex-col max-h-[85dvh]">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-6 pb-4 flex-shrink-0">
          <div>
            <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">bookmarks</span>
              {t.savedListTitle}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{t.savedListSubtitle}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4 flex-shrink-0">
          {TABS.map(({ key, icon, labelKey }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                tab === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{icon}</span>
              {t[labelKey]}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {tab === "list" ? (
            <TaskBankListTab
              taskBank={taskBank}
              selectedIds={selectedIds}
              onToggle={toggleId}
              onAddToBank={onAddToBank}
              onRemoveFromBank={onRemoveFromBank}
              onUpdateInBank={onUpdateInBank}
              onReorderBank={onReorderBank}
            />
          ) : (
            <TaskBankDateTab
              selectedIds={selectedIds}
              onToggle={toggleId}
              importDate={importDate}
              onImportDateChange={handleImportDateChange}
              importDateTasks={importDateTasks}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 pt-4 flex-shrink-0 border-t border-outline-variant/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">
              {withGenerate ? "play_circle" : "add_circle"}
            </span>
            {withGenerate ? t.addAndGenerate : t.addToToday}
          </button>
        </div>

      </div>
    </div>
  );
}

export default TaskBankModal;
