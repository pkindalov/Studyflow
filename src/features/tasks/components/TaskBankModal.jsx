import { useState, useMemo } from "react";
import { useLang } from "../../../shared/i18n/LangContext";

function TaskBankModal({
  taskBank,
  tasks,
  onConfirm,
  onClose,
  onRemoveFromBank,
  onAddToBank,
  onUpdateInBank,
  withGenerate = false,
}) {
  const { t } = useLang();
  const [tab, setTab] = useState("list");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importDate, setImportDate] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const importDateTasks = useMemo(() => {
    if (!importDate) return [];
    return (tasks[importDate] || []).filter((task) => !task.done);
  }, [tasks, importDate]);

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTabChange = (next) => {
    setTab(next);
    setSelectedIds(new Set());
    setEditingId(null);
    setSearchQuery("");
  };

  const filteredBank = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return taskBank;
    return taskBank.filter((task) => task.text.toLowerCase().includes(q));
  }, [taskBank, searchQuery]);

  const handleConfirm = () => {
    if (selectedIds.size === 0) return;
    const source = tab === "list" ? taskBank : importDateTasks;
    const selected = source.filter((task) => selectedIds.has(task.id));
    onConfirm(selected.map(({ text, priority, imageUrl }) => ({ text, priority, imageUrl })));
  };

  const handleAddToList = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddToBank(newTaskText.trim(), newTaskPriority);
    setNewTaskText("");
    setNewTaskPriority(false);
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditPriority(task.priority);
  };

  const saveEdit = () => {
    if (editText.trim() && editingId) {
      onUpdateInBank(editingId, editText.trim(), editPriority);
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

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
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-4 flex-shrink-0">
          <button
            onClick={() => handleTabChange("list")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "list"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined text-sm">bookmarks</span>
            {t.savedListTab}
          </button>
          <button
            onClick={() => handleTabChange("date")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === "date"
                ? "bg-primary text-on-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            {t.importFromDateTab}
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {tab === "list" ? (
            <div className="flex flex-col gap-2 pt-2 pb-2">
              {taskBank.length > 0 && (
                <div className="relative mb-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50 pointer-events-none">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.savedListSearch}
                    className="w-full bg-surface-container-highest border border-outline/40 rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
              )}
              {taskBank.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-6">{t.savedListEmpty}</p>
              )}
              {taskBank.length > 0 && filteredBank.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-6">{t.savedListNoResults}</p>
              )}

              {filteredBank.map((task) =>
                editingId === task.id ? (
                  /* ── Edit row ── */
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-highest border border-primary/40">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus
                      className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none min-w-0"
                    />
                    <button
                      onClick={() => setEditPriority((p) => !p)}
                      title={t.priorityTaskLabel}
                      className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${
                        editPriority
                          ? "bg-tertiary/15 border-tertiary/40 text-tertiary"
                          : "border-outline/40 text-on-surface-variant hover:text-tertiary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: editPriority ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                    </button>
                    <button onClick={saveEdit} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-base">check</span>
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </div>
                ) : (
                  /* ── Display row ── */
                  <label
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 cursor-pointer hover:bg-surface-container-high transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(task.id)}
                      onChange={() => toggleId(task.id)}
                      className="w-4 h-4 accent-primary flex-shrink-0"
                    />
                    <span className={`flex-1 text-sm text-on-surface min-w-0 ${task.priority ? "font-semibold" : "font-medium"}`}>
                      {task.text}
                    </span>
                    {task.priority && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary flex-shrink-0">
                        {t.priorityBadge}
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.preventDefault(); startEdit(task); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-primary hover:bg-primary/10 transition-all text-on-surface-variant/50 flex-shrink-0"
                      title={t.editListItem}
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); onRemoveFromBank(task.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-error hover:bg-error/10 transition-all text-on-surface-variant/50 flex-shrink-0"
                      title={t.removeFromList}
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </label>
                )
              )}

              {/* Add new task form */}
              <form onSubmit={handleAddToList} className="flex gap-2 pt-2 pb-1 border-t border-outline-variant/30 mt-1">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder={t.addToListPlaceholder}
                  className="flex-1 bg-surface-container-highest border border-outline/40 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setNewTaskPriority((p) => !p)}
                  title={t.priorityTaskLabel}
                  className={`p-2 rounded-xl border transition-all flex-shrink-0 ${
                    newTaskPriority
                      ? "bg-tertiary/15 border-tertiary/40 text-tertiary"
                      : "border-outline/40 text-on-surface-variant hover:border-tertiary/40 hover:text-tertiary"
                  }`}
                >
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: newTaskPriority ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                </button>
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {t.add}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-2">
              <input
                type="date"
                value={importDate}
                onChange={(e) => { setImportDate(e.target.value); setSelectedIds(new Set()); }}
                className="w-full bg-surface-container-highest border border-outline/40 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {!importDate && (
                <p className="text-xs text-on-surface-variant text-center py-3">{t.pickDateHint}</p>
              )}
              {importDate && importDateTasks.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">{t.noTasksOnDate}</p>
              )}
              {importDateTasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(task.id)}
                    onChange={() => toggleId(task.id)}
                    className="w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <span className="flex-1 text-sm font-medium text-on-surface">{task.text}</span>
                  {task.priority && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary flex-shrink-0">
                      {t.priorityBadge}
                    </span>
                  )}
                </label>
              ))}
            </div>
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
