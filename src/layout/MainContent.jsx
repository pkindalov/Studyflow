import { useRef, useEffect } from "react";
import { useLang } from "../shared/i18n/LangContext";
import SummaryCard from "../features/schedule/components/SummaryCard";
import TaskList from "../features/tasks/components/TaskList";
import SchedulePanel from "../features/schedule/components/SchedulePanel";

const formatDateHeading = function(date, lang, todayChip) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const locale = lang === "bg" ? "bg-BG" : "en-US";
  const formatted = date.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" });
  return isToday ? `${todayChip} · ${formatted}` : formatted;
};

export default function MainContent({
  total, completed, remaining, progress,
  tasks, onToggle, onDelete, onStopRecurring,
  excludedTaskIds, onToggleSelect, onOpenTimer,
  onSaveToBank, onOpenSavedList, savedListTexts,
  onReorder, onEdit, onAddClick, selectedDate,
  onGenerateSchedule,
  schedule, allScheduleDone, scheduleTimers, runningTaskId,
  scheduleSensors, onScheduleDragEnd, onOpenScheduleTimer,
  onMarkScheduleDone, onRemoveScheduleItem, onSaveSchedule, onDeleteSchedule,
  t,
}) {
  const { lang } = useLang();
  const schedulePanelRef = useRef(null);
  const prevScheduleRef = useRef(null);

  useEffect(() => {
    if (schedule && !prevScheduleRef.current && schedulePanelRef.current) {
      schedulePanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
    prevScheduleRef.current = schedule;
  }, [schedule]);

  return (
    <div id="main-content" className="lg:col-span-6 flex flex-col gap-6">
      {selectedDate && (
        <p className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest px-1">
          {formatDateHeading(selectedDate, lang, t.todayChip)}
        </p>
      )}
      <SummaryCard total={total} completed={completed} remaining={remaining} progress={progress} />
      <TaskList
        tasks={tasks}
        onToggle={onToggle}
        onDelete={onDelete}
        onStopRecurring={onStopRecurring}
        excludedTaskIds={excludedTaskIds}
        onToggleSelect={onToggleSelect}
        onOpenTimer={onOpenTimer}
        onSaveToBank={onSaveToBank}
        onOpenSavedList={onOpenSavedList}
        savedListTexts={savedListTexts}
        onReorder={onReorder}
        onEdit={onEdit}
        onAddClick={onAddClick}
      />
      {tasks.length > 0 && (
        <div className="flex gap-4 justify-end mt-2">
          <button
            className="flex-1 sm:flex-none px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow hover:opacity-90 transition-all flex items-center justify-center gap-2"
            onClick={onGenerateSchedule}
          >
            <span className="material-symbols-outlined">play_circle</span>
            {t.generateSchedule}
          </button>
        </div>
      )}
      {schedule && (
        <div ref={schedulePanelRef}>
          <SchedulePanel
            schedule={schedule}
            allScheduleDone={allScheduleDone}
            scheduleTimers={scheduleTimers}
            runningTaskId={runningTaskId}
            scheduleSensors={scheduleSensors}
            onScheduleDragEnd={onScheduleDragEnd}
            onOpenTimer={onOpenScheduleTimer}
            onMarkDone={onMarkScheduleDone}
            onRemove={onRemoveScheduleItem}
            onSave={onSaveSchedule}
            onDelete={onDeleteSchedule}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
