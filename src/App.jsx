import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "react-calendar/dist/Calendar.css";
import SchedulePanel from "./features/schedule/components/SchedulePanel";
import QuickTimerPrompt from "./features/schedule/components/QuickTimerPrompt";
import SwitchTaskDialog from "./features/schedule/components/SwitchTaskDialog";
import UnsavedScheduleWarning from "./features/schedule/components/UnsavedScheduleWarning";
import ClearAllConfirm from "./shared/components/ClearAllConfirm";
import ImportConfirmDialog from "./shared/components/ImportConfirmDialog";
import TaskList from "./features/tasks/components/TaskList";
import TaskModal from "./features/tasks/components/TaskModal";
import TimerModal from "./features/schedule/components/TimerModal";
import MinimizedTimer from "./features/schedule/components/MinimizedTimer";
import CalendarSidebar from "./features/calendar/components/CalendarSidebar";
import SummaryCard from "./features/schedule/components/SummaryCard";
import { StudyTimeSection, PrioritySection, QuoteSection, TasksProgressSection } from "./features/dashboard/components/RightSidebar";
import { ActivityPanel } from "./features/dashboard/components/ActivityPanel";
import MusicPanel from "./features/music/components/MusicPanel";
import { useTasks } from "./features/tasks/hooks/useTasks";
import { useMusicPlayer } from "./features/music/hooks/useMusicPlayer";
import { useRecurringTasks, appliesToDate } from "./features/tasks/hooks/useRecurringTasks";
import { markDateWithTasks } from "./features/calendar/utils/markDateWithTasks";
import { generateId } from "./shared/utils/id";
import HelpModal from "./shared/components/HelpModal";
import Confetti from "./shared/components/Confetti";
import TaskBankModal from "./features/tasks/components/TaskBankModal";
import { useTaskBank } from "./features/tasks/hooks/useTaskBank";
import { exportData } from "./shared/utils/dataPortability";
import { useLang } from "./shared/i18n/LangContext";
import { useColumnLayout } from "./features/dashboard/hooks/useColumnLayout";
import { useTimer } from "./features/schedule/hooks/useTimer";
import { useSchedule } from "./features/schedule/hooks/useSchedule";
import { SCHEDULES_KEY, TIMERS_KEY } from "./features/schedule/utils/scheduleStorage";
import { useTaskModal } from "./features/tasks/hooks/useTaskModal";
import { useDataPortability } from "./shared/hooks/useDataPortability";
import "./features/calendar/calendar.css";
import "./animations.css";

// Pure helpers — no state dependency, live outside the component
const formatDateKey = (date) => date.toLocaleDateString("en-CA");

// One-time migration: fold old per-date schedule_* keys into the unified objects
(() => {
  const readAll = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const schedules = readAll(SCHEDULES_KEY);
  const timers    = readAll(TIMERS_KEY);
  let migratedSchedules = false;
  let migratedTimers    = false;
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("schedule_timers_")) {
      const dk = k.slice("schedule_timers_".length);
      try { const v = JSON.parse(localStorage.getItem(k)); if (v && Object.keys(v).length > 0) { timers[dk] = v; migratedTimers = true; } } catch { /* ignore */ }
      localStorage.removeItem(k);
    } else if (k.startsWith("schedule_")) {
      const dk = k.slice("schedule_".length);
      try { const v = JSON.parse(localStorage.getItem(k)); if (v && v.length > 0) { schedules[dk] = v; migratedSchedules = true; } } catch { /* ignore */ }
      localStorage.removeItem(k);
    }
  });
  if (migratedSchedules) localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  if (migratedTimers)    localStorage.setItem(TIMERS_KEY,    JSON.stringify(timers));
})();

function SortableSection({ id, t, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      className="group/sec"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex justify-center mb-1 opacity-0 group-hover/sec:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        title={t.dragToMoveHint}
      >
        <span className="material-symbols-outlined text-base text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">drag_indicator</span>
      </div>
      {children}
    </div>
  );
}

function App() {
  const { lang, setLang, t } = useLang();
  const [theme, setTheme] = useState(() => localStorage.getItem("studyflow_theme") || "dark");
  const [showCalendarCompletion, setShowCalendarCompletion] = useState(
    () => localStorage.getItem("studyflow_calendar_completion") === "true"
  );
  const [showHelp, setShowHelp] = useState(false);
  const [notification, setNotification] = useState("");
  const [priorityPercent, setPriorityPercent] = useState(40);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [totalStudyTime, setTotalStudyTime] = useState(4);
  const [excludedTaskIds, setExcludedTaskIds] = useState(new Set());

  const dateKey = formatDateKey(selectedDate);

  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllScheduleDoneRef = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [showTaskBankModal, setShowTaskBankModal] = useState(false);
  const [taskBankModalAutoGenerate, setTaskBankModalAutoGenerate] = useState(false);

  const { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks, clearAllTasks } = useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring, clearAllRecurring } = useRecurringTasks();
  const { taskBank, addToBank, removeFromBank, updateInBank, reorderBank } = useTaskBank();
  const music = useMusicPlayer();

  const {
    columnLayout,
    sectionSensors,
    handleSectionDragStart,
    handleSectionDragOver,
    handleSectionDragEnd,
    resetLayout,
    isCustomLayout,
  } = useColumnLayout();

  // ─── Derived data ───────────────────────────────────────────────────────────
  const tasksForDay = useMemo(() => tasks[dateKey] || [], [tasks, dateKey]);

  const { totalTasks, completedTasks, remainingTasks, progress } = useMemo(() => {
    const total = tasksForDay.length;
    const completed = tasksForDay.filter((t) => t.done).length;
    return {
      totalTasks: total,
      completedTasks: completed,
      remainingTasks: total - completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  }, [tasksForDay]);

  const savedListTexts = useMemo(() => new Set(taskBank.map((t) => t.text)), [taskBank]);

  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }, []);

  const timer = useTimer({ dateKey, music, markTaskDone });
  const {
    timerTask,
    isTimerMinimized,
    setIsTimerMinimized,
    runningTaskId,
    setRunningTaskId,
    scheduleTimers,
    setScheduleTimers,
    taskAllocations,
    pendingTimerTask,
    setPendingTimerTask,
    pendingTimerMinutes,
    setPendingTimerMinutes,
    pendingSwitchTask,
    setPendingSwitchTask,
    pomodoroEnabled,
    setPomodoroEnabled,
    pomodoroMinutes,
    pomodoroResetAt,
    pomodoroBreakCount,
    openTimer,
    confirmSwitchTask,
    closeTimer,
    markTimerTaskDone,
    resetPomodoroState,
    toggleTimer,
    handleMainMusicToggle,
    timerMusic,
    handleSetPomodoroMinutes,
    resetTimer,
    timerOriginDateKeyRef,
  } = timer;

  const scheduleHook = useSchedule({
    dateKey,
    tasksForDay,
    excludedTaskIds,
    totalStudyTime,
    priorityPercent,
    scheduleTimers,
    setScheduleTimers,
    runningTaskId,
    setRunningTaskId,
    markTaskDone,
    showNotification,
    t,
  });
  const {
    schedule,
    showUnsavedWarning,
    allScheduleDone,
    scheduleSensors,
    handleScheduleDragEnd,
    generateSchedule,
    checkUnsaved,
    saveSchedule,
    deleteSchedule,
    handleMarkScheduleItemDone,
    handleRemoveScheduleItem,
    markScheduleItemUndone,
    removeTaskFromSchedule,
    handleUnsavedSaveAndContinue,
    handleUnsavedDiscard,
    handleUnsavedCancel,
    clearSchedule,
  } = scheduleHook;

  const addModal = useTaskModal({ mode: "add", dateKey, addTask, addRecurring });
  const editModal = useTaskModal({
    mode: "edit", dateKey, tasks, recurringTasks,
    editTask, moveTask, updateRecurring, addRecurring,
    linkRecurring, deleteRecurring, deleteAllByRecurringId,
    removeTaskFromSchedule, setScheduleTimers,
  });
  const isEditing = editModal.isOpen;
  const { pendingImport, setPendingImport, importError, importFileRef, handleImportFileChange, handleImportConfirm } = useDataPortability();

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studyflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("studyflow_calendar_completion", String(showCalendarCompletion));
  }, [showCalendarCompletion]);

  useEffect(() => {
    setExcludedTaskIds(new Set());
  }, [dateKey]);

  useEffect(() => {
    if (allScheduleDone && !prevAllScheduleDoneRef.current) {
      prevAllScheduleDoneRef.current = true;
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 4500);
      return () => clearTimeout(t);
    }
    if (!allScheduleDone) prevAllScheduleDoneRef.current = false;
  }, [allScheduleDone]);

  // ─── Recurring task auto-population ────────────────────────────────────────
  useEffect(() => {
    const existingIds = new Set(
      (tasks[dateKey] || []).map((t) => t.recurringId).filter(Boolean),
    );
    recurringTasks.forEach((template) => {
      if (existingIds.has(template.id)) return;
      if ((template.skippedDates || []).includes(dateKey)) return;
      if (!appliesToDate(template, dateKey)) return;
      addTaskDirect(dateKey, {
        id: generateId(),
        text: template.text,
        imageUrl: template.imageUrl,
        priority: template.priority,
        done: false,
        recurringId: template.id,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, recurringTasks]);

  const markDateWithTasksFn = useMemo(
    () => markDateWithTasks(tasks, formatDateKey, recurringTasks, showCalendarCompletion),
    [tasks, recurringTasks, showCalendarCompletion],
  );

  // ─── Timer wrappers that need cross-hook access ──────────────────────────────
  const openTimerForTask = useCallback((task) => {
    if (task.scheduledMinutes) {
      openTimer(task);
      return;
    }
    const elapsed = scheduleTimers[task.id] || 0;
    const allocated = taskAllocations[task.id];
    if (task.done) {
      const scheduleTask = schedule?.find((s) => s.id === task.id);
      const minutes = scheduleTask?.scheduledMinutes || allocated || 25;
      setScheduleTimers((prev) => ({ ...prev, [task.id]: minutes * 60 }));
      openTimer({ ...task, scheduledMinutes: minutes });
      return;
    }
    if (elapsed > 0 && allocated) {
      openTimer({ ...task, scheduledMinutes: allocated });
    } else {
      setPendingTimerTask(task);
      setPendingTimerMinutes(25);
    }
  }, [openTimer, scheduleTimers, taskAllocations, schedule, setScheduleTimers, setPendingTimerTask, setPendingTimerMinutes]);

  const restartTimer = useCallback(() => {
    if (!timerTask) return;
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    resetPomodoroState();
    toggleTask(timerOriginDateKeyRef.current || dateKey, timerTask.id);
    markScheduleItemUndone(timerTask.id);
    setRunningTaskId(timerTask.id);
    music.play();
  }, [timerTask, dateKey, setScheduleTimers, resetPomodoroState, toggleTask, timerOriginDateKeyRef, markScheduleItemUndone, setRunningTaskId, music]);

  const startAgainTimer = useCallback(() => {
    if (!timerTask) return;
    const originKey = timerOriginDateKeyRef.current || dateKey;
    const currentElapsed = scheduleTimers[timerTask.id] || 0;
    if (currentElapsed > 0) {
      try {
        const allExtra = JSON.parse(localStorage.getItem("studyflow_focus_extra") || "{}");
        const dayExtra = allExtra[originKey] || {};
        const prev = typeof dayExtra[timerTask.id] === "number" ? dayExtra[timerTask.id] : 0;
        localStorage.setItem("studyflow_focus_extra", JSON.stringify({
          ...allExtra,
          [originKey]: { ...dayExtra, [timerTask.id]: prev + currentElapsed },
        }));
      } catch { /* localStorage not available */ }
    }
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    resetPomodoroState();
    toggleTask(originKey, timerTask.id);
    markScheduleItemUndone(timerTask.id);
    setRunningTaskId(timerTask.id);
    music.play();
  }, [timerTask, dateKey, scheduleTimers, setScheduleTimers, resetPomodoroState, toggleTask, timerOriginDateKeyRef, markScheduleItemUndone, setRunningTaskId, music]);

  // ─── Task selection ─────────────────────────────────────────────────────────
  const toggleTaskSelection = useCallback((id) => {
    setExcludedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ─── Sync individual task toggle → schedule timer ───────────────────────────
  const handleToggleTask = useCallback((id) => {
    const task = (tasks[dateKey] || []).find((t) => t.id === id);
    toggleTask(dateKey, id);
    if (!task || !schedule) return;
    const inSchedule = schedule.find((s) => s.id === id);
    if (!inSchedule) return;
    const nowDone = !task.done;
    setScheduleTimers((prev) => ({
      ...prev,
      [id]: nowDone ? inSchedule.scheduledMinutes * 60 : 0,
    }));
  }, [tasks, dateKey, toggleTask, schedule, setScheduleTimers]);

  // ─── Date change — guard unsaved schedule ───────────────────────────────────
  const handleDateChange = useCallback((newDate) => {
    checkUnsaved(() => setSelectedDate(newDate));
  }, [checkUnsaved]);

  // ─── Generate schedule — opens task bank if no tasks ───────────────────────
  const handleGenerateSchedule = useCallback(() => {
    generateSchedule(() => {
      const allDone = tasksForDay.length > 0 && tasksForDay.every((task) => task.done);
      if (allDone) { showNotification(t.allDoneNothing); return; }
      setTaskBankModalAutoGenerate(true);
      setShowTaskBankModal(true);
    });
  }, [generateSchedule, tasksForDay, showNotification, t]);

  // ─── Task CRUD handlers ─────────────────────────────────────────────────────
  const handleDeleteTask = useCallback((id) => {
    const task = (tasks[dateKey] || []).find((t) => t.id === id);
    if (task?.recurringId) {
      deleteRecurring(task.recurringId);
      deleteAllByRecurringId(task.recurringId);
      removeTaskFromSchedule((t) => t.recurringId === task.recurringId);
    } else {
      deleteTask(dateKey, id);
      removeTaskFromSchedule((t) => t.id === id);
    }
  }, [tasks, dateKey, deleteRecurring, deleteAllByRecurringId, deleteTask, removeTaskFromSchedule]);

  const handleClearAll = useCallback(() => {
    clearAllTasks();
    clearAllRecurring();
    clearSchedule();
    resetTimer();
    setExcludedTaskIds(new Set());
    resetLayout();
    setShowClearConfirm(false);
  }, [clearAllTasks, clearAllRecurring, clearSchedule, resetTimer, resetLayout]);

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const SECTION_JSX = {
    calendar: (
      <CalendarSidebar
        selectedDate={selectedDate}
        setSelectedDate={handleDateChange}
        markDateWithTasks={markDateWithTasksFn}
        onAddClick={() => addModal.open({ startDate: dateKey })}
        showCompletion={showCalendarCompletion}
        onToggleCompletion={() => setShowCalendarCompletion((v) => !v)}
      />
    ),
    activity: <ActivityPanel tasks={tasks} />,
    studyTime: (
      <StudyTimeSection totalStudyTime={totalStudyTime} setTotalStudyTime={setTotalStudyTime} />
    ),
    priorityPercent: (
      <PrioritySection priorityPercent={priorityPercent} setPriorityPercent={setPriorityPercent} />
    ),
    quote: <QuoteSection />,
    todaysTasks: (
      <TasksProgressSection
        tasks={tasks}
        recurringTasks={recurringTasks}
        tasksForDay={tasksForDay}
        scheduleTimers={scheduleTimers}
        taskAllocations={taskAllocations}
      />
    ),
    music: (
      <MusicPanel
        playlist={music.playlist}
        activeTrackId={music.activeTrackId}
        activeTrack={music.activeTrack}
        isPlaying={music.isPlaying}
        volume={music.volume}
        playbackError={music.playbackError}
        onSelectTrack={music.selectTrack}
        onAddTrack={music.addTrack}
        onRemoveTrack={music.removeTrack}
        onTogglePlay={handleMainMusicToggle}
        onSetVolume={music.setVolume}
        onClearPlaybackError={music.clearPlaybackError}
      />
    ),
  };

  const sideColClass = "lg:col-span-3 flex flex-col gap-4 lg:gap-6 rounded-2xl min-h-16";

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-dvh p-4 sm:p-6 pt-6 ${theme === "light" ? "bg-[#f0eeff]" : "bg-[#0c0c1a]"}`}>
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg font-semibold animate-fade-in text-sm text-center max-w-[90vw]">
          {notification}
        </div>
      )}
      {/* Mobile-only top toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high shadow-sm transition-all"
            title={t.howStudyflowWorks}
            aria-label="Help"
          >
            <span className="material-symbols-outlined text-base">help_outline</span>
          </button>
          <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >EN</button>
            <button
              onClick={() => setLang("bg")}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >БГ</button>
          </div>
          <button
            onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all"
            title={theme === "dark" ? t.switchToLight : t.switchToDark}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
            {theme === "dark" ? t.lightMode : t.darkMode}
          </button>
        </div>
      </div>

      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragStart={handleSectionDragStart}
        onDragOver={handleSectionDragOver}
        onDragEnd={handleSectionDragEnd}
      >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Sidebar */}
        <div className={sideColClass}>
          <SortableContext items={columnLayout.left} strategy={verticalListSortingStrategy}>
            {columnLayout.left.map((id) => (
              <SortableSection key={id} id={id} t={t}>{SECTION_JSX[id]}</SortableSection>
            ))}
          </SortableContext>
        </div>
        {/* Main Content */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <SummaryCard
            total={totalTasks}
            completed={completedTasks}
            remaining={remainingTasks}
            progress={progress}
          />
          <TaskList
            tasks={tasksForDay}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onStopRecurring={(recurringId) => { deleteRecurring(recurringId); deleteAllByRecurringId(recurringId); }}
            excludedTaskIds={excludedTaskIds}
            onToggleSelect={toggleTaskSelection}
            onOpenTimer={openTimerForTask}
            onSaveToBank={(task) => {
              if (savedListTexts.has(task.text)) {
                const bankTask = taskBank.find((bt) => bt.text === task.text);
                if (bankTask) removeFromBank(bankTask.id);
              } else {
                addToBank(task.text, task.priority);
                showNotification(t.saveToList);
              }
            }}
            onOpenSavedList={() => { setTaskBankModalAutoGenerate(false); setShowTaskBankModal(true); }}
            savedListTexts={savedListTexts}
            onReorder={(draggedId, targetId) => reorderTasks(dateKey, draggedId, targetId)}
            onEdit={(task) => editModal.open(task)}
          />
          {tasksForDay.length > 0 && (
            <div className="flex gap-4 justify-end mt-2">
              <button
                className="flex-1 sm:flex-none px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold shadow hover:opacity-90 transition-all flex items-center justify-center gap-2"
                onClick={handleGenerateSchedule}
              >
                <span className="material-symbols-outlined">play_circle</span>
                {t.generateSchedule}
              </button>
            </div>
          )}
          {schedule && (
            <SchedulePanel
              schedule={schedule}
              allScheduleDone={allScheduleDone}
              scheduleTimers={scheduleTimers}
              runningTaskId={runningTaskId}
              scheduleSensors={scheduleSensors}
              onScheduleDragEnd={handleScheduleDragEnd}
              onOpenTimer={openTimer}
              onMarkDone={handleMarkScheduleItemDone}
              onRemove={handleRemoveScheduleItem}
              onSave={saveSchedule}
              onDelete={deleteSchedule}
              t={t}
            />
          )}
        </div>
        {/* Right Sidebar */}
        <div className={sideColClass}>
          <SortableContext items={columnLayout.right} strategy={verticalListSortingStrategy}>
            {columnLayout.right.map((id) => (
              <SortableSection key={id} id={id} t={t}>{SECTION_JSX[id]}</SortableSection>
            ))}
          </SortableContext>
        </div>
      </div>
      </DndContext>

      {/* Mobile-only bottom toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={exportData} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.exportTitle}>
            <span className="material-symbols-outlined text-sm">backup</span>
            {t.exportBtn}
          </button>
          <button onClick={() => importFileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.importTitle}>
            <span className="material-symbols-outlined text-sm">restore</span>
            {t.importBtn}
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-sm transition-all" title={t.clearTitle}>
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            {t.clearBtn}
          </button>
        </div>
        {isCustomLayout && (
          <button onClick={resetLayout} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all">
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t.resetLayoutBtn}
          </button>
        )}
      </div>

      {/* Theme toggle + language + Help — desktop fixed top-right */}
      <div className="hidden lg:flex fixed top-5 right-5 z-40 items-center gap-2">
        <button onClick={() => setShowHelp(true)} className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high shadow-lg transition-all" title={t.howStudyflowWorks} aria-label="Help">
          <span className="material-symbols-outlined text-base">help_outline</span>
        </button>
        <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl shadow-lg overflow-hidden">
          <button onClick={() => setLang("en")} className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}>EN</button>
          <button onClick={() => setLang("bg")} className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}>БГ</button>
        </div>
        <button
          onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all"
          title={theme === "dark" ? t.switchToLight : t.switchToDark}
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          {theme === "dark" ? t.lightMode : t.darkMode}
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <Confetti active={showConfetti} />

      {/* Reset layout — desktop fixed bottom-right */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40">
        <button
          onClick={resetLayout}
          disabled={!isCustomLayout}
          className={`flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold shadow-lg transition-all ${isCustomLayout ? "hover:bg-surface-container-high" : "opacity-40 cursor-not-allowed"}`}
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          {t.resetLayoutBtn}
        </button>
      </div>

      {/* Timer Modal */}
      {timerTask && !isTimerMinimized && (
        <TimerModal
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onPlayPause={toggleTimer}
          onClose={closeTimer}
          onRestart={restartTimer}
          onStartAgain={startAgainTimer}
          onMarkDone={markTimerTaskDone}
          onMinimize={() => setIsTimerMinimized(true)}
          music={timerMusic}
          pomodoroEnabled={pomodoroEnabled}
          setPomodoroEnabled={setPomodoroEnabled}
          pomodoroMinutes={pomodoroMinutes}
          setPomodoroMinutes={handleSetPomodoroMinutes}
          pomodoroResetAt={pomodoroResetAt}
          pomodoroBreakCount={pomodoroBreakCount}
        />
      )}
      {/* Minimized timer pill */}
      {timerTask && isTimerMinimized && (
        <MinimizedTimer
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onExpand={() => setIsTimerMinimized(false)}
          onPlayPause={toggleTimer}
        />
      )}
      {/* Quick-timer prompt for unscheduled tasks */}
      {pendingTimerTask && (
        <QuickTimerPrompt
          task={pendingTimerTask}
          minutes={pendingTimerMinutes}
          onChangeMinutes={setPendingTimerMinutes}
          onConfirm={() => {
            setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
            openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
            setPendingTimerTask(null);
          }}
          onCancel={() => setPendingTimerTask(null)}
          t={t}
        />
      )}
      {/* Task Bank Modal */}
      {showTaskBankModal && (
        <TaskBankModal
          taskBank={taskBank}
          tasks={tasks}
          onClose={() => setShowTaskBankModal(false)}
          onRemoveFromBank={removeFromBank}
          onAddToBank={addToBank}
          onUpdateInBank={updateInBank}
          onReorderBank={reorderBank}
          withGenerate={taskBankModalAutoGenerate}
          onConfirm={(selectedTasks) => {
            selectedTasks.forEach(({ text, priority, imageUrl }) =>
              addTaskDirect(dateKey, { id: generateId(), text, priority: !!priority, imageUrl: imageUrl || "", done: false })
            );
            setShowTaskBankModal(false);
            if (taskBankModalAutoGenerate) setTimeout(handleGenerateSchedule, 0);
          }}
        />
      )}
      {/* Task Modal */}
      <TaskModal
        isOpen={addModal.isOpen || editModal.isOpen}
        onClose={() => { isEditing ? editModal.reset() : addModal.reset(); }}
        onSave={isEditing ? editModal.handleSubmit : addModal.handleSubmit}
        text={isEditing ? editModal.text : addModal.text}
        setText={isEditing ? editModal.setText : addModal.setText}
        image={isEditing ? editModal.image : addModal.image}
        setImage={isEditing ? editModal.setImage : addModal.setImage}
        priority={isEditing ? editModal.priority : addModal.priority}
        setPriority={isEditing ? editModal.setPriority : addModal.setPriority}
        recurrence={isEditing ? editModal.recurrence : addModal.recurrence}
        setRecurrence={isEditing ? editModal.setRecurrence : addModal.setRecurrence}
        startDate={isEditing ? editModal.startDate : addModal.startDate}
        setStartDate={isEditing ? editModal.setStartDate : addModal.setStartDate}
        endDate={isEditing ? editModal.endDate : addModal.endDate}
        setEndDate={isEditing ? editModal.setEndDate : addModal.setEndDate}
        monthsAhead={isEditing ? editModal.monthsAhead : addModal.monthsAhead}
        setMonthsAhead={isEditing ? editModal.setMonthsAhead : addModal.setMonthsAhead}
        yearsAhead={isEditing ? editModal.yearsAhead : addModal.yearsAhead}
        setYearsAhead={isEditing ? editModal.setYearsAhead : addModal.setYearsAhead}
        isRecurringInstance={isEditing ? editModal.isRecurringInstance : false}
        moveToDate={isEditing && !editModal.isRecurringInstance ? editModal.targetDate : undefined}
        setMoveToDate={isEditing && !editModal.isRecurringInstance ? editModal.setTargetDate : undefined}
        title={isEditing ? t.editTaskTitle : t.addTaskTitle}
      />
      {/* Bottom-left actions — desktop only */}
      <div className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2">
        <button onClick={exportData} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.exportTitle}>
          <span className="material-symbols-outlined text-sm">backup</span>
          {t.exportBtn}
        </button>
        <button onClick={() => importFileRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.importTitle}>
          <span className="material-symbols-outlined text-sm">restore</span>
          {t.importBtn}
        </button>
        <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-lg transition-all" title={t.clearTitle}>
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          {t.clearBtn}
        </button>
      </div>
      <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFileChange} />
      {importError && (
        <div className="fixed bottom-20 left-6 z-50 bg-error text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold max-w-xs">{importError}</div>
      )}
      {/* Import confirmation modal */}
      {pendingImport && (
        <ImportConfirmDialog
          exportedAt={pendingImport.exportedAt}
          lang={lang}
          onCancel={() => setPendingImport(null)}
          onConfirm={handleImportConfirm}
          t={t}
        />
      )}
      {/* Switch task confirmation */}
      {pendingSwitchTask && timerTask && (
        <SwitchTaskDialog
          fromTask={timerTask}
          toTask={pendingSwitchTask}
          onConfirm={confirmSwitchTask}
          onCancel={() => setPendingSwitchTask(null)}
          t={t}
        />
      )}
      {/* Unsaved schedule warning */}
      {showUnsavedWarning && (
        <UnsavedScheduleWarning
          onCancel={handleUnsavedCancel}
          onDiscard={handleUnsavedDiscard}
          onSaveAndContinue={handleUnsavedSaveAndContinue}
          t={t}
        />
      )}
      {/* Clear all data — confirmation */}
      {showClearConfirm && (
        <ClearAllConfirm
          onCancel={() => setShowClearConfirm(false)}
          onConfirm={handleClearAll}
          t={t}
        />
      )}
    </div>
  );
}

export default App;
