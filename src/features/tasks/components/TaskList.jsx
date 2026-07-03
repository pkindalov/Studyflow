import { useState } from "react";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";
import Pagination from "../../../shared/components/Pagination";
import { useLang } from "../../../shared/i18n/LangContext";
import { PAGE_SIZE } from "../../../shared/utils/uiConstants";

const SortableTaskCard = function({ id, scheduledMinutes, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  // Inline style required: dnd-kit applies CSS transform at runtime for drag animation
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard {...props} dragging={isDragging} dragHandleListeners={listeners} dragHandleAttributes={attributes} scheduledMinutes={scheduledMinutes} />
    </div>
  );
}

const TaskList = function({ tasks, isGridView, onToggle, onDelete, onEdit, onStopRecurring, excludedTaskIds, onToggleSelect, onOpenTimer, onSaveToBank, onOpenSavedList, savedListTexts, onReorder, onAddClick, scheduleMap }) {
  const { t } = useLang();
  const [page, setPage] = useState(0);
  const safeExcludedTaskIds = excludedTaskIds ?? new Set();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = function({ active, over }) {
    if (!over || active.id === over.id) return;
    onReorder?.(active.id, over.id);
  };

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const paginated = tasks.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const showSelectionControls = onToggleSelect !== undefined;
  const allSelected = showSelectionControls && tasks.every((task) => !safeExcludedTaskIds.has(task.id));
  // Count only currently-visible excluded tasks; excludedTaskIds can hold stale ids for deleted tasks.
  const excludedVisibleCount = tasks.filter((task) => safeExcludedTaskIds.has(task.id)).length;

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
                  tasks.forEach((task) => { if (!safeExcludedTaskIds.has(task.id)) onToggleSelect(task.id); });
                } else {
                  tasks.forEach((task) => { if (safeExcludedTaskIds.has(task.id)) onToggleSelect(task.id); });
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

      {showSelectionControls && excludedVisibleCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-sm text-on-surface-variant/60 flex-shrink-0">info</span>
          <span className="text-xs text-on-surface-variant">
            {t.excludedCountHint(excludedVisibleCount)}
          </span>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 mt-8">
          <p className="text-on-surface-variant text-sm text-center">{t.noTasksMessage}</p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all shadow"
            >
              <span className="material-symbols-outlined text-base">add</span>
              {t.noTasksAddFirst}
            </button>
          )}
          {onOpenSavedList && (
            <button
              onClick={onOpenSavedList}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors"
            >
              <span className="material-symbols-outlined text-sm">bookmarks</span>
              {t.useFromSavedList}
            </button>
          )}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginated.map((task) => task.id)} strategy={verticalListSortingStrategy}>
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
                    selected={showSelectionControls ? !safeExcludedTaskIds.has(task.id) : true}
                    onToggleSelect={onToggleSelect}
                    onOpenTimer={onOpenTimer}
                    onSaveToBank={onSaveToBank}
                    isInList={savedListTexts ? savedListTexts.has(task.text) : false}
                    scheduledMinutes={scheduleMap ? scheduleMap[task.id] : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPrev={() => setPage(Math.max(0, currentPage - 1))}
            onNext={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
          />
        </>
      )}
    </section>
  );
}

export default TaskList;
