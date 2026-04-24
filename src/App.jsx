import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ScheduleItem from "./features/schedule/components/ScheduleItem";
import "react-calendar/dist/Calendar.css";
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
import { exportData, readBackupFile, applyBackup } from "./shared/utils/dataPortability";
import { useLang } from "./shared/i18n/LangContext";
import { useColumnLayout } from "./features/dashboard/hooks/useColumnLayout";
import { useTimer } from "./features/schedule/hooks/useTimer";
import { useSchedule } from "./features/schedule/hooks/useSchedule";
import { computeRecurringEndDate } from "./features/tasks/utils/recurrence";
import { SCHEDULES_KEY, TIMERS_KEY, readAllTimers, writeTimersForDate } from "./features/schedule/utils/scheduleStorage";
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskImage, setNewTaskImage] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(false);
  const [newTaskRecurrence, setNewTaskRecurrence] = useState("none");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskMonthsAhead, setNewTaskMonthsAhead] = useState("3");
  const [newTaskYearsAhead, setNewTaskYearsAhead] = useState("2");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskImage, setEditTaskImage] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState(false);
  const [editTaskRecurrence, setEditTaskRecurrence] = useState("none");
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskEndDate, setEditTaskEndDate] = useState("");
  const [editTaskMonthsAhead, setEditTaskMonthsAhead] = useState("3");
  const [editTaskYearsAhead, setEditTaskYearsAhead] = useState("2");
  const [editTaskIsRecurringInstance, setEditTaskIsRecurringInstance] = useState(false);
  const [editTaskTargetDate, setEditTaskTargetDate] = useState("");

  const isEditing = isEditModalOpen;
  const dateKey = formatDateKey(selectedDate);

  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllScheduleDoneRef = useRef(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Import backup state
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState("");
  const importFileRef = useRef(null);

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

  // ─── Modal resets ───────────────────────────────────────────────────────────
  const resetAddModal = useCallback(() => {
    setIsModalOpen(false);
    setNewTaskText("");
    setNewTaskImage("");
    setNewTaskPriority(false);
    setNewTaskRecurrence("none");
    setNewTaskStartDate("");
    setNewTaskEndDate("");
    setNewTaskMonthsAhead("3");
    setNewTaskYearsAhead("2");
  }, []);

  const resetEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditTaskId(null);
    setEditTaskText("");
    setEditTaskImage("");
    setEditTaskPriority(false);
    setEditTaskRecurrence("none");
    setEditTaskStartDate("");
    setEditTaskEndDate("");
    setEditTaskMonthsAhead("3");
    setEditTaskYearsAhead("2");
    setEditTaskIsRecurringInstance(false);
    setEditTaskTargetDate("");
  }, []);

  // ─── Task CRUD handlers ─────────────────────────────────────────────────────
  const handleAddTask = useCallback(() => {
    const startDate = newTaskStartDate || dateKey;
    if (newTaskRecurrence !== "none") {
      const actualRecurrence = newTaskRecurrence === "custom" ? "daily" : newTaskRecurrence;
      const endDate = computeRecurringEndDate(newTaskRecurrence, startDate, newTaskMonthsAhead, newTaskYearsAhead, newTaskEndDate);
      addRecurring(newTaskText, newTaskImage, newTaskPriority, actualRecurrence, startDate, endDate);
    } else {
      addTask(dateKey, newTaskText, newTaskImage, newTaskPriority);
    }
    resetAddModal();
  }, [newTaskRecurrence, newTaskStartDate, dateKey, newTaskMonthsAhead, newTaskYearsAhead, newTaskEndDate, newTaskText, newTaskImage, newTaskPriority, addRecurring, addTask, resetAddModal]);

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

  const handleEditTask = useCallback(() => {
    editTask(dateKey, editTaskId, editTaskText, editTaskImage, editTaskPriority);
    if (editTaskTargetDate && editTaskTargetDate !== dateKey) {
      moveTask(dateKey, editTaskTargetDate, editTaskId);
      removeTaskFromSchedule((t) => t.id === editTaskId);
      setScheduleTimers((prev) => {
        const next = { ...prev };
        delete next[editTaskId];
        return next;
      });
      try {
        const allTimers = readAllTimers();
        const targetTimers = { ...(allTimers[editTaskTargetDate] || {}) };
        delete targetTimers[editTaskId];
        writeTimersForDate(editTaskTargetDate, targetTimers);
      } catch { /* ignore */ }
    }
    const task = (tasks[dateKey] || []).find((t) => t.id === editTaskId);
    const startDate = editTaskStartDate || dateKey;
    if (editTaskRecurrence !== "none") {
      const actualRecurrence = editTaskRecurrence === "custom" ? "daily" : editTaskRecurrence;
      const endDate = computeRecurringEndDate(editTaskRecurrence, startDate, editTaskMonthsAhead, editTaskYearsAhead, editTaskEndDate);
      if (task?.recurringId) {
        updateRecurring(task.recurringId, editTaskText, editTaskImage, editTaskPriority, actualRecurrence, startDate, endDate);
      } else {
        const newId = addRecurring(editTaskText, editTaskImage, editTaskPriority, actualRecurrence, startDate, endDate);
        linkRecurring(dateKey, editTaskId, newId);
      }
    } else if (task?.recurringId) {
      deleteRecurring(task.recurringId);
      deleteAllByRecurringId(task.recurringId);
      linkRecurring(dateKey, editTaskId, null);
    }
    resetEditModal();
  }, [editTaskId, editTaskText, editTaskImage, editTaskPriority, editTaskRecurrence, editTaskStartDate, editTaskMonthsAhead, editTaskYearsAhead, editTaskEndDate, editTaskTargetDate, tasks, dateKey, editTask, moveTask, updateRecurring, addRecurring, linkRecurring, deleteRecurring, deleteAllByRecurringId, resetEditModal, removeTaskFromSchedule, setScheduleTimers]);

  const handleClearAll = useCallback(() => {
    clearAllTasks();
    clearAllRecurring();
    clearSchedule();
    resetTimer();
    setExcludedTaskIds(new Set());
    resetLayout();
    setShowClearConfirm(false);
  }, [clearAllTasks, clearAllRecurring, clearSchedule, resetTimer, resetLayout]);

  // ─── Import / Export handlers ───────────────────────────────────────────────
  const handleImportFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImportError("");
    try {
      const summary = await readBackupFile(file);
      setPendingImport(summary);
    } catch (err) {
      setImportError(err.message);
    }
  }, []);

  const handleImportConfirm = useCallback(() => {
    if (!pendingImport) return;
    applyBackup(pendingImport.rawData);
    setPendingImport(null);
    window.location.reload();
  }, [pendingImport]);

  // ─── Render helpers ─────────────────────────────────────────────────────────
  const SECTION_JSX = {
    calendar: (
      <CalendarSidebar
        selectedDate={selectedDate}
        setSelectedDate={handleDateChange}
        markDateWithTasks={markDateWithTasksFn}
        onAddClick={() => { setNewTaskStartDate(dateKey); setIsModalOpen(true); }}
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
            onEdit={(task) => {
              setEditTaskId(task.id);
              setEditTaskText(task.text);
              setEditTaskImage(task.imageUrl || "");
              setEditTaskPriority(task.priority);
              if (task.recurringId) {
                const tpl = recurringTasks.find((r) => r.id === task.recurringId);
                setEditTaskRecurrence(tpl?.recurrence || "none");
                setEditTaskStartDate(tpl?.startDate || dateKey);
                setEditTaskEndDate(tpl?.endDate || "");
                setEditTaskIsRecurringInstance(true);
                setEditTaskTargetDate("");
              } else {
                setEditTaskRecurrence("none");
                setEditTaskStartDate(dateKey);
                setEditTaskEndDate("");
                setEditTaskIsRecurringInstance(false);
                setEditTaskTargetDate(dateKey);
              }
              setIsEditModalOpen(true);
            }}
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
                <DndContext sensors={scheduleSensors} collisionDetection={closestCenter} onDragEnd={handleScheduleDragEnd}>
                  <SortableContext items={schedule.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    <ul className="flex flex-col gap-3">
                      {schedule.map((task) => (
                        <ScheduleItem
                          key={task.id}
                          task={task}
                          elapsed={scheduleTimers[task.id] || 0}
                          isRunning={runningTaskId === task.id}
                          runningTaskId={runningTaskId}
                          onOpenTimer={openTimer}
                          onMarkDone={handleMarkScheduleItemDone}
                          onRemove={handleRemoveScheduleItem}
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
                  onClick={saveSchedule}
                >
                  <span className="material-symbols-outlined text-base">save</span>
                  {t.saveSchedule}
                </button>
                <button
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-semibold hover:bg-error/20 transition-all flex items-center justify-center gap-2 text-sm"
                  onClick={deleteSchedule}
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  {t.delete}
                </button>
              </div>
            </>
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
          <button onClick={() => { setImportError(""); importFileRef.current?.click(); }} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.importTitle}>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-xs p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-headline font-bold text-on-surface text-base leading-tight line-clamp-2">{pendingTimerTask.text}</h3>
              <p className="text-xs text-on-surface-variant">{t.howManyMinutes}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number" min="1" max="480" value={pendingTimerMinutes}
                onChange={(e) => setPendingTimerMinutes(Math.max(1, Math.min(480, Number(e.target.value))))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
                    openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
                    setPendingTimerTask(null);
                  } else if (e.key === "Escape") {
                    setPendingTimerTask(null);
                  }
                }}
                autoFocus
                className="flex-1 bg-surface-container-highest border border-outline/60 rounded-xl px-3 py-2 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="text-sm text-on-surface-variant">{t.minUnit}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingTimerTask(null)} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
              <button
                onClick={() => {
                  setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
                  openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
                  setPendingTimerTask(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all"
              >{t.startTimerBtn}</button>
            </div>
          </div>
        </div>
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
        isOpen={isModalOpen || isEditModalOpen}
        onClose={() => { isEditing ? resetEditModal() : resetAddModal(); }}
        onSave={isEditing ? handleEditTask : handleAddTask}
        text={isEditing ? editTaskText : newTaskText}
        setText={isEditing ? setEditTaskText : setNewTaskText}
        image={isEditing ? editTaskImage : newTaskImage}
        setImage={isEditing ? setEditTaskImage : setNewTaskImage}
        priority={isEditing ? editTaskPriority : newTaskPriority}
        setPriority={isEditing ? setEditTaskPriority : setNewTaskPriority}
        recurrence={isEditing ? editTaskRecurrence : newTaskRecurrence}
        setRecurrence={isEditing ? setEditTaskRecurrence : setNewTaskRecurrence}
        startDate={isEditing ? editTaskStartDate : newTaskStartDate}
        setStartDate={isEditing ? setEditTaskStartDate : setNewTaskStartDate}
        endDate={isEditing ? editTaskEndDate : newTaskEndDate}
        setEndDate={isEditing ? setEditTaskEndDate : setNewTaskEndDate}
        monthsAhead={isEditing ? editTaskMonthsAhead : newTaskMonthsAhead}
        setMonthsAhead={isEditing ? setEditTaskMonthsAhead : setNewTaskMonthsAhead}
        yearsAhead={isEditing ? editTaskYearsAhead : newTaskYearsAhead}
        setYearsAhead={isEditing ? setEditTaskYearsAhead : setNewTaskYearsAhead}
        isRecurringInstance={isEditing ? editTaskIsRecurringInstance : false}
        moveToDate={isEditing && !editTaskIsRecurringInstance ? editTaskTargetDate : undefined}
        setMoveToDate={isEditing && !editTaskIsRecurringInstance ? setEditTaskTargetDate : undefined}
        title={isEditing ? t.editTaskTitle : t.addTaskTitle}
      />
      {/* Bottom-left actions — desktop only */}
      <div className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2">
        <button onClick={exportData} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.exportTitle}>
          <span className="material-symbols-outlined text-sm">backup</span>
          {t.exportBtn}
        </button>
        <button onClick={() => { setImportError(""); importFileRef.current?.click(); }} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.importTitle}>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">restore</span>
                {t.restoreBackupTitle}
              </h3>
              <p className="text-sm text-on-surface-variant">
                {t.restoreConfirmFn(
                  pendingImport.exportedAt
                    ? new Date(pendingImport.exportedAt).toLocaleDateString(lang === "bg" ? "bg-BG" : "en-US", { dateStyle: "medium" })
                    : t.unknownDate
                )}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPendingImport(null)} className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all text-sm">{t.cancel}</button>
              <button onClick={handleImportConfirm} className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-all text-sm">{t.restore}</button>
            </div>
          </div>
        </div>
      )}
      {/* Switch task confirmation */}
      {pendingSwitchTask && timerTask && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">swap_horiz</span>
                {t.switchTaskTitle}
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0.5 bg-surface-container-high rounded-xl px-3 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">{t.switchTaskFrom}</span>
                  <span className="text-sm font-semibold text-on-surface line-clamp-1">{timerTask.text}</span>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant/40">arrow_downward</span>
                </div>
                <div className="flex flex-col gap-0.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">{t.switchTaskTo}</span>
                  <span className="text-sm font-semibold text-on-surface line-clamp-1">{pendingSwitchTask.text}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingSwitchTask(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
              <button onClick={confirmSwitchTask} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all">{t.switchBtn}</button>
            </div>
          </div>
        </div>
      )}
      {/* Unsaved schedule warning */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-warning, #f59e0b)" }}>warning</span>
                {t.unsavedScheduleTitle}
              </h3>
              <p className="text-sm text-on-surface-variant">{t.unsavedScheduleMsg}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleUnsavedCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
              <button onClick={handleUnsavedDiscard} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all">{t.discardAndContinue}</button>
              <button onClick={handleUnsavedSaveAndContinue} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all">{t.saveAndContinue}</button>
            </div>
          </div>
        </div>
      )}
      {/* Clear all data — confirmation */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">warning</span>
                {t.clearAllDataTitle}
              </h3>
              <p className="text-sm text-on-surface-variant">{t.clearWarningMsg}</p>
              <ul className="text-sm text-on-surface-variant flex flex-col gap-1 pl-2">
                {[t.clearItem1, t.clearItem2, t.clearItem3, t.clearItem4].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-error/60 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2 mt-1">{t.cannotUndo}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
              <button onClick={handleClearAll} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all">{t.clearConfirmBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
