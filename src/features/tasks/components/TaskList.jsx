import { useState, useEffect, useRef } from "react";
import TaskCard from "./TaskCard";
import Pagination from "../../../shared/components/Pagination";
import { useLang } from "../../../shared/i18n/LangContext";

const PAGE_SIZE = 8;

function TaskList({ tasks, isGridView, onToggle, onDelete, onEdit, onStopRecurring, excludedTaskIds, onToggleSelect, onOpenTimer, onReorder }) {
  const { t } = useLang();
  const [page, setPage] = useState(0);
  const [draggedId, setDraggedId] = useState(null);
  const dragOverRef = useRef(null);

  useEffect(() => { setPage(0); }, [tasks.length]);

  const handleDragStart = (id) => { setDraggedId(id); dragOverRef.current = id; };
  const handleDragEnter = (id) => {
    if (!draggedId || id === dragOverRef.current) return;
    dragOverRef.current = id;
    onReorder?.(draggedId, id);
  };
  const handleDragEnd = () => { setDraggedId(null); dragOverRef.current = null; };
  const handleDragOver = (e) => e.preventDefault();

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const paginated = tasks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const showSelectionControls = !!onToggleSelect;
  const allSelected = showSelectionControls && tasks.every((task) => !excludedTaskIds.has(task.id));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
          {t.tasksHeading}
        </h2>
        {showSelectionControls && tasks.length > 0 && (
          <button
            onClick={() => {
              if (allSelected) {
                tasks.forEach((task) => { if (!excludedTaskIds.has(task.id)) onToggleSelect(task.id); });
              } else {
                tasks.forEach((task) => { if (excludedTaskIds.has(task.id)) onToggleSelect(task.id); });
              }
            }}
            className="text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors"
          >
            {allSelected ? t.deselectAll : t.selectAll}
          </button>
        )}
        {!showSelectionControls && (
          <button className="text-sm font-semibold text-primary hover:underline transition-all">
            {t.viewAllArchives}
          </button>
        )}
      </div>
      {tasks.length === 0 ? (
        <p className="text-on-surface-variant text-sm text-center mt-10">
          {t.noTasksMessage}
        </p>
      ) : (
        <>
          <div className={isGridView ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "flex flex-col gap-6"}>
            {paginated.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onStopRecurring={onStopRecurring}
                selected={showSelectionControls ? !excludedTaskIds.has(task.id) : true}
                onToggleSelect={onToggleSelect}
                onOpenTimer={onOpenTimer}
                dragging={draggedId === task.id}
                onDragStart={onReorder ? handleDragStart : undefined}
                onDragEnter={onReorder ? handleDragEnter : undefined}
                onDragEnd={onReorder ? handleDragEnd : undefined}
                onDragOver={onReorder ? handleDragOver : undefined}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
}

export default TaskList;
