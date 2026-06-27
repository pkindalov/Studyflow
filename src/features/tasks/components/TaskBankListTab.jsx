import { useState, useMemo } from "react";
import { useLang } from "../../../shared/i18n/LangContext";

const SORT_LABELS = { manual: "sortManual", priority: "sortPriority", az: "sortAZ", za: "sortZA" };

const BankTaskRow = function({ task, isSelected, isDraggable, dragOverId, onToggle, onRemove, onUpdate, onReorder, setDragOverId }) {
  const { t } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState(false);

  const startEdit = function() {
    setIsEditing(true);
    setEditText(task.text);
    setEditPriority(task.priority);
  };

  const saveEdit = function() {
    if (editText.trim()) onUpdate(task.id, editText.trim(), editPriority);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-highest border border-primary/40">
        <input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setIsEditing(false); }}
          autoFocus
          className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none min-w-0"
        />
        <button onClick={() => setEditPriority((p) => !p)} title={t.priorityTaskLabel} className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${editPriority ? "bg-tertiary/15 border-tertiary/40 text-tertiary" : "border-outline/40 text-on-surface-variant hover:text-tertiary"}`}>
          <span className={`material-symbols-outlined text-base ${editPriority ? "icon-filled" : "icon-outlined"}`}>star</span>
        </button>
        <button onClick={saveEdit} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-base">check</span>
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="row"
      draggable={isDraggable}
      onClick={() => onToggle(task.id)}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", task.id); }}
      onDragOver={(e) => { e.preventDefault(); setDragOverId(task.id); }}
      onDragLeave={() => setDragOverId(null)}
      onDrop={(e) => { e.preventDefault(); onReorder(e.dataTransfer.getData("text/plain"), task.id); setDragOverId(null); }}
      onDragEnd={() => setDragOverId(null)}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group cursor-pointer ${
        dragOverId === task.id ? "bg-primary/10 border-primary/40" : "bg-surface-container-low border-outline-variant/50 hover:bg-surface-container-high"
      }`}
    >
      {isDraggable && (
        <span className="material-symbols-outlined text-base text-on-surface-variant/30 group-hover:text-on-surface-variant/60 flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors">
          drag_indicator
        </span>
      )}
      <input type="checkbox" checked={isSelected} onChange={() => onToggle(task.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary flex-shrink-0" />
      <span className={`flex-1 text-sm text-on-surface min-w-0 ${task.priority ? "font-semibold" : "font-medium"}`}>{task.text}</span>
      {task.priority && <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary flex-shrink-0">{t.priorityBadge}</span>}
      <button onClick={(e) => { e.stopPropagation(); startEdit(); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-primary hover:bg-primary/10 transition-all text-on-surface-variant/50 flex-shrink-0" aria-label={t.editListItem} title={t.editListItem}>
        <span className="material-symbols-outlined text-base">edit</span>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onRemove(task.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:text-error hover:bg-error/10 transition-all text-on-surface-variant/50 flex-shrink-0" aria-label={t.removeFromList} title={t.removeFromList}>
        <span className="material-symbols-outlined text-base">delete</span>
      </button>
    </div>
  );
};

const TaskBankListTab = function({ taskBank, selectedIds, onToggle, onAddToBank, onRemoveFromBank, onUpdateInBank, onReorderBank }) {
  const { t } = useLang();
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("manual");
  const [dragOverId, setDragOverId] = useState(null);

  const filteredBank = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = q ? taskBank.filter((task) => task.text.toLowerCase().includes(q)) : [...taskBank];
    if (sortOrder === "priority") return [...base].sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
    if (sortOrder === "az") return [...base].sort((a, b) => a.text.localeCompare(b.text));
    if (sortOrder === "za") return [...base].sort((a, b) => b.text.localeCompare(a.text));
    return base;
  }, [taskBank, searchQuery, sortOrder]);

  const handleAddToList = function(e) {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddToBank(newTaskText.trim(), newTaskPriority);
    setNewTaskText("");
    setNewTaskPriority(false);
  };

  const isDraggable = !searchQuery && sortOrder === "manual";

  return (
    <div className="flex flex-col gap-2 pt-2 pb-2">
      {taskBank.length > 0 && (
        <div className="flex gap-2 mb-1">
          {Object.keys(SORT_LABELS).map((opt) => (
            <button key={opt} onClick={() => setSortOrder(opt)} className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${sortOrder === opt ? "bg-primary/15 text-primary border border-primary/40" : "bg-surface-container-highest text-on-surface-variant border border-outline/30 hover:border-outline/60"}`}>
              {t[SORT_LABELS[opt]]}
            </button>
          ))}
        </div>
      )}

      {taskBank.length > 0 && (
        <div className="relative mb-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-variant/50 pointer-events-none">search</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.savedListSearch} className="w-full bg-surface-container-highest border border-outline/40 rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
      )}

      {taskBank.length === 0 && <p className="text-sm text-on-surface-variant text-center py-6">{t.savedListEmpty}</p>}
      {taskBank.length > 0 && filteredBank.length === 0 && <p className="text-sm text-on-surface-variant text-center py-6">{t.savedListNoResults}</p>}

      {filteredBank.map((task) => (
        <BankTaskRow
          key={task.id}
          task={task}
          isSelected={selectedIds.has(task.id)}
          isDraggable={isDraggable}
          dragOverId={dragOverId}
          onToggle={onToggle}
          onRemove={onRemoveFromBank}
          onUpdate={onUpdateInBank}
          onReorder={onReorderBank}
          setDragOverId={setDragOverId}
        />
      ))}

      <form onSubmit={handleAddToList} className="flex flex-col gap-2 pt-2 pb-1 border-t border-outline-variant/30 mt-1">
        <textarea
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddToList(e); } }}
          placeholder={t.addToListPlaceholder}
          rows={3}
          className="w-full bg-surface-container-highest border border-outline/60 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/60 resize-none"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setNewTaskPriority((p) => !p)} title={t.priorityTaskLabel} className={`p-2 rounded-xl border transition-all ${newTaskPriority ? "bg-tertiary/15 border-tertiary/40 text-tertiary" : "border-outline/40 text-on-surface-variant hover:border-tertiary/40 hover:text-tertiary"}`}>
            <span className={`material-symbols-outlined text-base ${newTaskPriority ? "icon-filled" : "icon-outlined"}`}>star</span>
          </button>
          <button type="submit" disabled={!newTaskText.trim()} className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {t.add}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TaskBankListTab;
