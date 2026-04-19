import { useState, useEffect } from "react";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import Pagination from "../../../shared/components/Pagination";
import { useLang } from "../../../shared/i18n/LangContext";

const PAGE_SIZE = 8;

function SortableTaskCard({ id, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard {...props} dragging={isDragging} dragHandleListeners={listeners} dragHandleAttributes={attributes} />
    </div>
  );
}

function TaskList({ tasks, isGridView, onToggle, onDelete, onEdit, onStopRecurring, excludedTaskIds, onToggleSelect, onOpenTimer, onSaveToBank, onOpenSavedList, savedListTexts, onReorder }) {
  const { t } = useLang();
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [tasks.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    onReorder?.(active.id, over.id);
  };

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const paginated = tasks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const showSelectionControls = !!onToggleSelect;
  const allSelected = showSelectionControls && tasks.every((task) => !excludedTaskIds.has(task.id));

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
          {t.tasksHeading}
        </h2>
        <div className="flex items-center gap-2">
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
          {onOpenSavedList && (
            <button
              onClick={onOpenSavedList}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">bookmarks</span>
              {t.savedListBtn}
            </button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-on-surface-variant text-sm text-center">{t.noTasksMessage}</p>
          {onOpenSavedList && (
            <button
              onClick={onOpenSavedList}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all"
            >
              <span className="material-symbols-outlined text-base">bookmarks</span>
              {t.useFromSavedList}
            </button>
          )}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginated.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className={isGridView ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "flex flex-col gap-6"}>
                {paginated.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    id={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onStopRecurring={onStopRecurring}
                    selected={showSelectionControls ? !excludedTaskIds.has(task.id) : true}
                    onToggleSelect={onToggleSelect}
                    onOpenTimer={onOpenTimer}
                    onSaveToBank={onSaveToBank}
                    isInList={savedListTexts ? savedListTexts.has(task.text) : false}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
