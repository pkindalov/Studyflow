import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import ScheduleItem from "./ScheduleItem";

export default function SchedulePanel({
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
  return (
    <>
      <div className={`mt-8 rounded-2xl border p-6 transition-all duration-700 ${allScheduleDone ? "bg-emerald-700/80 border-emerald-500/40" : "bg-surface-container border-outline-variant/50"}`}>
        {allScheduleDone ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="material-symbols-outlined text-5xl text-emerald-200" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <h3 className="font-headline font-bold text-2xl text-white">{t.scheduleAllDoneHeadline}</h3>
            <p className="text-sm text-emerald-100 max-w-xs leading-relaxed">{t.scheduleAllDoneBody}</p>
          </div>
        ) : (
          <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary">schedule</span>
            {t.todaysSchedule}
          </h3>
        )}
        <DndContext sensors={scheduleSensors} collisionDetection={closestCenter} onDragEnd={onScheduleDragEnd}>
          <SortableContext items={schedule.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-3">
              {schedule.map((task) => (
                <ScheduleItem
                  key={task.id}
                  task={task}
                  elapsed={scheduleTimers[task.id] || 0}
                  isRunning={runningTaskId === task.id}
                  runningTaskId={runningTaskId}
                  onOpenTimer={onOpenTimer}
                  onMarkDone={onMarkDone}
                  onRemove={onRemove}
                  t={t}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex gap-3 justify-end mt-4 flex-wrap">
        <button
          className="flex-1 sm:flex-none px-5 py-2.5 bg-secondary/15 text-secondary border border-secondary/30 rounded-xl font-semibold hover:bg-secondary/25 transition-all flex items-center justify-center gap-2 text-sm"
          onClick={onSave}
        >
          <span className="material-symbols-outlined text-base">save</span>
          {t.saveSchedule}
        </button>
        <button
          className="flex-1 sm:flex-none px-5 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-semibold hover:bg-error/20 transition-all flex items-center justify-center gap-2 text-sm"
          onClick={onDelete}
        >
          <span className="material-symbols-outlined text-base">delete</span>
          {t.delete}
        </button>
      </div>
    </>
  );
}
