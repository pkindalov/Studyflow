import { useLang } from "../../../shared/i18n/LangContext";

const TaskBankDateTab = function({ selectedIds, onToggle, importDate, onImportDateChange, importDateTasks }) {
  const { t } = useLang();

  return (
    <div className="flex flex-col gap-3 pb-2">
      <input
        type="date"
        value={importDate}
        onChange={(e) => onImportDateChange(e.target.value)}
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
            onChange={() => onToggle(task.id)}
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
  );
}

export default TaskBankDateTab;
