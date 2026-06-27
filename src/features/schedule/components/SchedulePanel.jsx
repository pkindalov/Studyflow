import { useState, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ScheduleItem from "./ScheduleItem";
import useFocusTrap from "../../../shared/hooks/useFocusTrap";

const SchedulePanel = function({
  schedule,
  allScheduleDone,
  scheduleTimers,
  runningTaskId,
  scheduleSensors,
  onScheduleDragEnd,
  onOpenTimer,
  onMarkDone,
  onRemove,
  onSave,
  onDelete,
  t,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dialogRef = useRef(null);
  const handleDialogKeyDown = useFocusTrap(dialogRef, {
    isActive: showDeleteConfirm,
    onEscape: () => setShowDeleteConfirm(false),
  });

  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-delete-title"
            onKeyDown={handleDialogKeyDown}
            className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h3 id="schedule-delete-title" className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">delete</span>
                {t.deleteScheduleConfirmTitle}
              </h3>
              <p className="text-sm text-on-surface-variant">{t.deleteScheduleConfirmMsg}</p>
              <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2">{t.cannotUndo}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">
                {t.cancel}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); onDelete(); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all">
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`mt-8 rounded-2xl border p-6 transition-all duration-700 ${allScheduleDone ? "bg-secondary-container border-secondary/30" : "bg-surface-container border-outline-variant/50"}`}>
        {allScheduleDone ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary icon-filled">verified</span>
            <h3 className="font-headline font-bold text-2xl text-on-surface">{t.scheduleAllDoneHeadline}</h3>
            <p className="text-sm text-on-surface-variant max-w-xs leading-relaxed">{t.scheduleAllDoneBody}</p>
          </div>
        ) : (
          <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary">schedule</span>
            {t.todaysSchedule}
            {runningTaskId && schedule.some((item) => item.id === runningTaskId) && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse ml-1 flex-shrink-0" aria-hidden="true" />
            )}
          </h3>
        )}
        {!allScheduleDone && (
          <DndContext sensors={scheduleSensors} collisionDetection={closestCenter} onDragEnd={onScheduleDragEnd}>
            <SortableContext items={schedule.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className="flex flex-col gap-3">
                {schedule.map((task) => (
                  <ScheduleItem
                    key={task.id}
                    task={task}
                    elapsed={scheduleTimers[task.id] || 0}
                    isRunning={runningTaskId === task.id}
                    onOpenTimer={onOpenTimer}
                    onMarkDone={onMarkDone}
                    onRemove={onRemove}
                    t={t}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      <div className="flex gap-3 justify-between items-center mt-4 flex-wrap">
        <button
          className="min-h-[44px] px-3 text-xs font-semibold text-error/70 hover:text-error transition-colors flex items-center gap-1"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          {t.delete}
        </button>
        <button
          className="min-h-[44px] px-3 text-xs font-semibold text-secondary hover:text-secondary/70 transition-colors flex items-center gap-1"
          onClick={onSave}
        >
          <span className="material-symbols-outlined text-sm">save</span>
          {t.saveSchedule}
        </button>
      </div>
    </>
  );
};

export default SchedulePanel;
