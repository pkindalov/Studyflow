import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ScheduleItem from "./features/schedule/components/ScheduleItem";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TaskList from "./features/tasks/components/TaskList";
import TaskModal from "./features/tasks/components/TaskModal";
import TimerModal from "./features/schedule/components/TimerModal";
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
import "./features/calendar/calendar.css";
import "./animations.css";

// Pure helpers — no state dependency, live outside the component
const formatDateKey = (date) => date.toLocaleDateString("en-CA");

const DEFAULT_LAYOUT = { left: ["calendar", "activity"], right: ["studyTime", "priorityPercent", "quote", "todaysTasks", "music"] };

// ─── Consolidated localStorage helpers ──────────────────────────────────────
const SCHEDULES_KEY = "studyflow_schedules";
const TIMERS_KEY = "studyflow_schedule_timers";

const readAllSchedules = () => { try { return JSON.parse(localStorage.getItem(SCHEDULES_KEY)) || {}; } catch { return {}; } };
const readAllTimers    = () => { try { return JSON.parse(localStorage.getItem(TIMERS_KEY))    || {}; } catch { return {}; } };

const writeScheduleForDate = (dateKey, schedule) => {
  const all = readAllSchedules();
  if (!schedule || schedule.length === 0) { delete all[dateKey]; }
  else { all[dateKey] = schedule; }
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(all));
};

const writeTimersForDate = (dateKey, timers) => {
  const all = readAllTimers();
  if (!timers || Object.keys(timers).length === 0) { delete all[dateKey]; }
  else { all[dateKey] = timers; }
  localStorage.setItem(TIMERS_KEY, JSON.stringify(all));
};

// One-time migration: fold old per-date schedule_* keys into the unified objects
(() => {
  const schedules = readAllSchedules();
  const timers    = readAllTimers();
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

function computeRecurringEndDate(recurrence, startDate, monthsAhead, yearsAhead, customEndDate) {
  const start = new Date((startDate) + "T12:00:00");
  if (recurrence === "daily") {
    const lastDay = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return lastDay.toLocaleDateString("en-CA");
  }
  if (recurrence === "monthly") {
    const d = new Date(start);
    d.setMonth(d.getMonth() + Math.max(1, parseInt(monthsAhead) || 3));
    return d.toLocaleDateString("en-CA");
  }
  if (recurrence === "yearly") {
    const d = new Date(start);
    d.setFullYear(d.getFullYear() + Math.max(1, parseInt(yearsAhead) || 2));
    return d.toLocaleDateString("en-CA");
  }
  // custom: user-supplied end date; use "daily" as the actual recurrence
  return customEndDate || "";
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

  // Column layout — which sidebar sections live in left vs right
  const [columnLayout, setColumnLayout] = useState(() => {
    try {
      const saved = localStorage.getItem("studyflow_column_layout");
      if (!saved) return DEFAULT_LAYOUT;
      const parsed = JSON.parse(saved);
      // Migration: add new panel IDs that don't exist in the saved layout yet
      const allSaved = [...(parsed.left || []), ...(parsed.right || [])];
      const missingLeft = DEFAULT_LAYOUT.left.filter((id) => !allSaved.includes(id));
      const missingRight = DEFAULT_LAYOUT.right.filter((id) => !allSaved.includes(id));
      if (missingLeft.length > 0 || missingRight.length > 0) {
        return {
          left: [...(parsed.left || []), ...missingLeft],
          right: [...missingRight, ...(parsed.right || [])],
        };
      }
      return parsed;
    } catch { return DEFAULT_LAYOUT; }
  });
  const skipTimerPersistRef = useRef(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllScheduleDoneRef = useRef(false);
  const [scheduleUnsaved, setScheduleUnsaved] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const unsavedProceedRef = useRef(null);

  // Schedule state
  const [schedule, setSchedule] = useState(null);

  // Timer state
  const [timerTask, setTimerTask] = useState(null);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [scheduleTimers, setScheduleTimers] = useState({});
  // Maps taskId → scheduledMinutes so RightSidebar can show live progress
  const [taskAllocations, setTaskAllocations] = useState({});

  // Refs for wall-clock timer (survive tab-switch throttling)
  const scheduleTimersRef = useRef({});
  const timerStartRef = useRef(null); // { startedAt, baseElapsed, taskId, totalSeconds }
  const lastTimerTaskIdRef = useRef(null);

  // Quick-timer prompt for unscheduled tasks
  const [pendingTimerTask, setPendingTimerTask] = useState(null);
  const [pendingTimerMinutes, setPendingTimerMinutes] = useState(25);

  // Pomodoro state — persisted so settings survive refresh
  const [pomodoroEnabled, setPomodoroEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pomodoro_enabled")) ?? false; } catch { return false; }
  });
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pomodoro_minutes")) ?? 25; } catch { return 25; }
  });
  const [pomodoroResetAt, setPomodoroResetAt] = useState(0);
  const [pomodoroBreakCount, setPomodoroBreakCount] = useState(0);
  const musicWasPlayingRef = useRef(false);
  const musicStartedFromTimerRef = useRef(false);

  const { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks, clearAllTasks } = useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring, clearAllRecurring } = useRecurringTasks();
  const { taskBank, addToBank, removeFromBank, updateInBank, reorderBank } = useTaskBank();
  const music = useMusicPlayer();

  const [showTaskBankModal, setShowTaskBankModal] = useState(false);
  const [taskBankModalAutoGenerate, setTaskBankModalAutoGenerate] = useState(false);

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

  const allScheduleDone = useMemo(() =>
    !!schedule && schedule.length > 0 && schedule.every((task) =>
      task.done || (scheduleTimers[task.id] || 0) >= task.scheduledMinutes * 60
    ),
  [schedule, scheduleTimers]);

  useEffect(() => {
    if (allScheduleDone && !prevAllScheduleDoneRef.current) {
      prevAllScheduleDoneRef.current = true;
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4500);
      return () => clearTimeout(timer);
    }
    if (!allScheduleDone) prevAllScheduleDoneRef.current = false;
  }, [allScheduleDone]);

  const markDateWithTasksFn = useMemo(
    () => markDateWithTasks(tasks, formatDateKey, recurringTasks, showCalendarCompletion),
    [tasks, recurringTasks, showCalendarCompletion],
  );

  // ─── Column layout persistence & handlers ───────────────────────────────────
  useEffect(() => {
    localStorage.setItem("studyflow_column_layout", JSON.stringify(columnLayout));
  }, [columnLayout]);

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const sectionDragSnapshot = useRef(null);

  const handleSectionDragStart = useCallback(() => {
    setColumnLayout((prev) => { sectionDragSnapshot.current = prev; return prev; });
  }, []);

  const handleSectionDragOver = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    const activeId = active.id;
    const overId = over.id;
    setColumnLayout((prev) => {
      const overInLeft = prev.left.includes(overId);
      const overInRight = prev.right.includes(overId);
      if (!overInLeft && !overInRight) return prev;
      const withoutActive = {
        left: prev.left.filter((id) => id !== activeId),
        right: prev.right.filter((id) => id !== activeId),
      };
      const targetCol = overInLeft ? "left" : "right";
      const list = [...withoutActive[targetCol]];
      const overIdx = list.indexOf(overId);
      if (overIdx === -1) return prev;
      list.splice(overIdx, 0, activeId);
      return { ...withoutActive, [targetCol]: list };
    });
  }, []);

  const handleSectionDragEnd = useCallback(({ over }) => {
    if (!over && sectionDragSnapshot.current) {
      setColumnLayout(sectionDragSnapshot.current);
    }
    sectionDragSnapshot.current = null;
  }, []);


  const resetLayout = useCallback(() => setColumnLayout(DEFAULT_LAYOUT), []);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Import backup state
  const [pendingImport, setPendingImport] = useState(null); // { exportedAt, keyCount, rawData }
  const [importError, setImportError] = useState("");
  const importFileRef = useRef(null);

  const handleClearAll = useCallback(() => {
    clearAllTasks();
    clearAllRecurring();
    setSchedule(null);
    setScheduleTimers({});
    setRunningTaskId(null);
    setTimerTask(null);
    setExcludedTaskIds(new Set());
    setTaskAllocations({});
    setColumnLayout(DEFAULT_LAYOUT);
    localStorage.removeItem(SCHEDULES_KEY);
    localStorage.removeItem(TIMERS_KEY);
    setScheduleUnsaved(false);
    setShowUnsavedWarning(false);
    setShowClearConfirm(false);
  }, [clearAllTasks, clearAllRecurring]);

  // ─── Theme ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studyflow_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("studyflow_calendar_completion", String(showCalendarCompletion));
  }, [showCalendarCompletion]);

  // ─── Persistence effects ────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("pomodoro_enabled", JSON.stringify(pomodoroEnabled));
  }, [pomodoroEnabled]);

  useEffect(() => {
    localStorage.setItem("pomodoro_minutes", JSON.stringify(pomodoroMinutes));
  }, [pomodoroMinutes]);

  useEffect(() => {
    setExcludedTaskIds(new Set());
    setTaskAllocations({});
  }, [dateKey]);

  useEffect(() => {
    const allSchedules = readAllSchedules();
    setSchedule(allSchedules[dateKey] || null);
    setScheduleUnsaved(false);
    const allTimers = readAllTimers();
    skipTimerPersistRef.current = true;
    setScheduleTimers(allTimers[dateKey] || {});
    setRunningTaskId(null);
    setTimerTask(null);
  }, [dateKey]);

  useEffect(() => {
    if (skipTimerPersistRef.current) {
      skipTimerPersistRef.current = false;
      return;
    }
    writeTimersForDate(dateKey, scheduleTimers);
  }, [scheduleTimers, dateKey]);

  // ─── Keep a ref in sync so the interval can read current elapsed without
  //     listing scheduleTimers as a dependency (which would reset the clock).
  useEffect(() => { scheduleTimersRef.current = scheduleTimers; }, [scheduleTimers]);

  // ─── Countdown interval — wall-clock based, survives tab throttling ─────────
  useEffect(() => {
    if (!runningTaskId) return;
    const task = (schedule && schedule.find((t) => t.id === runningTaskId)) || timerTask;
    if (!task) return;
    const totalSeconds = task.scheduledMinutes * 60;
    const taskId = runningTaskId;

    // Snapshot the current elapsed and wall-clock start time once.
    const startedAt = Date.now();
    const baseElapsed = scheduleTimersRef.current[taskId] || 0;
    timerStartRef.current = { startedAt, baseElapsed, taskId, totalSeconds };

    const tick = () => {
      const { startedAt: sa, baseElapsed: be, taskId: tid, totalSeconds: ts } = timerStartRef.current;
      const nowElapsed = Math.min(ts, be + Math.floor((Date.now() - sa) / 1000));
      setScheduleTimers((prev) => ({ ...prev, [tid]: nowElapsed }));
    };

    const interval = setInterval(tick, 1000);
    return () => {
      clearInterval(interval);
      timerStartRef.current = null;
    };
  }, [runningTaskId, schedule, timerTask]);

  // ─── Catch up immediately when the tab becomes visible again ────────────────
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== "visible" || !timerStartRef.current) return;
      const { startedAt, baseElapsed, taskId, totalSeconds } = timerStartRef.current;
      const nowElapsed = Math.min(totalSeconds, baseElapsed + Math.floor((Date.now() - startedAt) / 1000));
      setScheduleTimers((prev) => ({ ...prev, [taskId]: nowElapsed }));
    };
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  // ─── Document title — reflects timer state for background-tab awareness ────
  useEffect(() => {
    if (!timerTask) {
      document.title = "StudyFlow";
      return () => { document.title = "StudyFlow"; };
    }
    document.title = runningTaskId
      ? `⏱ ${timerTask.text} — StudyFlow`
      : `⏸ Paused — StudyFlow`;
    return () => { document.title = "StudyFlow"; };
  }, [timerTask, runningTaskId]);

  // ─── Completion & pomodoro detection — runs after each timer tick ───────────
  // useEffect callbacks are NOT double-invoked by StrictMode on re-renders,
  // unlike state updater functions — so side-effects here fire exactly once.
  useEffect(() => {
    if (!runningTaskId) return;
    const task = (schedule && schedule.find((t) => t.id === runningTaskId)) || timerTask;
    if (!task) return;
    const totalSeconds = task.scheduledMinutes * 60;
    const elapsed = scheduleTimers[runningTaskId] || 0;
    if (elapsed >= totalSeconds) {
      setRunningTaskId(null);
      markTaskDone(dateKey, runningTaskId);
      if (musicStartedFromTimerRef.current) {
        music.pause();
        musicStartedFromTimerRef.current = false;
      }
      return;
    }
    const pomodoroSeconds = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
    if (pomodoroSeconds > 0 && elapsed > pomodoroResetAt && (elapsed - pomodoroResetAt) % pomodoroSeconds === 0) {
      setPomodoroResetAt(elapsed);
      setPomodoroBreakCount((n) => n + 1);
      setRunningTaskId(null);
      music.pause();
    }
  }, [scheduleTimers, runningTaskId, schedule, timerTask, dateKey, markTaskDone, pomodoroEnabled, pomodoroMinutes, pomodoroResetAt, music]);

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

  // ─── Notification ───────────────────────────────────────────────────────────
  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }, []);

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
  }, [tasks, dateKey, toggleTask, schedule]);

  // ─── Timer controls ─────────────────────────────────────────────────────────
  const openTimer = useCallback((task) => {
    if (lastTimerTaskIdRef.current !== task.id) {
      // Derive pomodoro state from this task's actual elapsed time so that
      // returning to a previously-started task restores the correct cycle count.
      const elapsed = scheduleTimers[task.id] || 0;
      const pomSec = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
      if (pomSec > 0 && elapsed > 0) {
        const breakCount = Math.floor(elapsed / pomSec);
        setPomodoroBreakCount(breakCount);
        setPomodoroResetAt(breakCount * pomSec);
      } else {
        setPomodoroResetAt(0);
        setPomodoroBreakCount(0);
      }
      lastTimerTaskIdRef.current = task.id;
    }
    setTimerTask(task);
    setTaskAllocations((prev) => ({ ...prev, [task.id]: task.scheduledMinutes }));
    const elapsed = scheduleTimers[task.id] || 0;
    if (elapsed < task.scheduledMinutes * 60) {
      setRunningTaskId(task.id);
    }
  }, [scheduleTimers, pomodoroEnabled, pomodoroMinutes]);

  const openTimerForTask = useCallback((task) => {
    if (task.scheduledMinutes) {
      openTimer(task);
      return;
    }
    const elapsed = scheduleTimers[task.id] || 0;
    const allocated = taskAllocations[task.id];
    if (elapsed > 0 && allocated) {
      // Resume previous session with the same allocation
      openTimer({ ...task, scheduledMinutes: allocated });
    } else {
      setPendingTimerTask(task);
      setPendingTimerMinutes(25);
    }
  }, [openTimer, scheduleTimers, taskAllocations]);

  const closeTimer = useCallback(() => {
    setRunningTaskId(null);
    setTimerTask(null);
    music.pause();
    musicStartedFromTimerRef.current = false;
  }, [music]);

  const markTimerTaskDone = useCallback(() => {
    if (!timerTask) return;
    setRunningTaskId(null);
    markTaskDone(dateKey, timerTask.id);
    setSchedule((prev) => prev?.map((t) => t.id === timerTask.id ? { ...t, done: true } : t) ?? null);
    music.pause();
    setTimerTask(null);
  }, [timerTask, dateKey, markTaskDone, music]);

  const restartTimer = useCallback(() => {
    if (!timerTask) return;
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    setPomodoroResetAt(0);
    setPomodoroBreakCount(0);
    toggleTask(dateKey, timerTask.id); // task was force-marked done; toggle it back to undone
    setRunningTaskId(timerTask.id);
    music.play();
    musicStartedFromTimerRef.current = true;
  }, [timerTask, dateKey, toggleTask, music]);

  const toggleTimer = useCallback(() => {
    if (!timerTask) return;
    if (runningTaskId === timerTask.id) {
      musicWasPlayingRef.current = music.isPlaying;
      setRunningTaskId(null);
      music.pause();
    } else {
      const elapsed = scheduleTimers[timerTask.id] || 0;
      if (elapsed < timerTask.scheduledMinutes * 60) {
        // Only advance the Pomodoro baseline when exactly on a boundary to
        // prevent the detection effect from immediately re-firing (e.g. 1500s % 1500 === 0).
        const pomSec = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
        if (pomSec > 0 && elapsed > pomodoroResetAt && (elapsed - pomodoroResetAt) % pomSec === 0) {
          setPomodoroResetAt(elapsed);
        }
        setRunningTaskId(timerTask.id);
        // On fresh start always play; on resume only if music was playing before pause.
        if (elapsed === 0 || musicWasPlayingRef.current) {
          music.play();
          musicStartedFromTimerRef.current = true;
        }
      }
    }
  }, [timerTask, runningTaskId, scheduleTimers, music, pomodoroEnabled, pomodoroMinutes, pomodoroResetAt]);

  // ─── Music origin tracking — differentiates timer vs main-page play ─────────
  const handleTimerMusicToggle = useCallback(() => {
    if (!music.isPlaying) musicStartedFromTimerRef.current = true;
    music.togglePlay();
  }, [music]);

  const handleMainMusicToggle = useCallback(() => {
    if (!music.isPlaying) musicStartedFromTimerRef.current = false;
    music.togglePlay();
  }, [music]);

  const timerMusic = useMemo(() => ({ ...music, togglePlay: handleTimerMusicToggle }), [music, handleTimerMusicToggle]);

  const handleSetPomodoroMinutes = useCallback((val) => {
    const currentElapsed = timerTask ? (scheduleTimers[timerTask.id] || 0) : 0;
    setPomodoroResetAt(currentElapsed);
    setPomodoroBreakCount(0);
    setPomodoroMinutes(val);
  }, [timerTask, scheduleTimers]);

  // ─── Schedule controls ──────────────────────────────────────────────────────
  const doGenerate = useCallback(() => {
    const selectedTasks = tasksForDay.filter((task) => !excludedTaskIds.has(task.id) && !task.done);
    if (totalStudyTime <= 0) return;
    if (!selectedTasks.length) {
      const allDone = tasksForDay.length > 0 && tasksForDay.every((task) => task.done);
      if (allDone) { showNotification(t.allDoneNothing); return; }
      // No tasks at all — open the saved list modal and auto-generate after confirm
      setTaskBankModalAutoGenerate(true);
      setShowTaskBankModal(true);
      return;
    }
    const priorityTasks = selectedTasks.filter((task) => task.priority);
    const nonPriorityTasks = selectedTasks.filter((task) => !task.priority);
    let scheduleArr = [];
    const totalMinutes = Math.max(1, Math.round(totalStudyTime * 60));
    let priorityMinutes = priorityTasks.length && priorityPercent > 0
      ? Math.round((Math.min(priorityPercent, 100) / 100) * totalMinutes)
      : 0;
    let nonPriorityMinutes = totalMinutes - priorityMinutes;

    if (priorityTasks.length === 0) {
      nonPriorityMinutes = totalMinutes;
      priorityMinutes = 0;
    } else if (priorityTasks.length === tasksForDay.length) {
      priorityMinutes = totalMinutes;
      nonPriorityMinutes = 0;
    }

    if (priorityTasks.length > 0) {
      if (priorityTasks.length === 1) {
        scheduleArr.push({ ...priorityTasks[0], scheduledMinutes: priorityMinutes });
      } else {
        const minPerTask = Math.floor(priorityMinutes / priorityTasks.length);
        let left = priorityMinutes;
        priorityTasks.forEach((task, i) => {
          const time = i === priorityTasks.length - 1 ? left : minPerTask;
          scheduleArr.push({ ...task, scheduledMinutes: time });
          left -= time;
        });
      }
    }
    if (nonPriorityTasks.length > 0) {
      if (nonPriorityTasks.length === 1) {
        scheduleArr.push({ ...nonPriorityTasks[0], scheduledMinutes: nonPriorityMinutes });
      } else {
        const minPerTask = Math.floor(nonPriorityMinutes / nonPriorityTasks.length);
        let left = nonPriorityMinutes;
        nonPriorityTasks.forEach((task, i) => {
          const time = i === nonPriorityTasks.length - 1 ? left : minPerTask;
          scheduleArr.push({ ...task, scheduledMinutes: time });
          left -= time;
        });
      }
    }

    const prioritySlice = scheduleArr.filter((task) => task.priority).sort(() => Math.random() - 0.5);
    const normalSlice = scheduleArr.filter((task) => !task.priority).sort(() => Math.random() - 0.5);
    setRunningTaskId(null);
    setScheduleTimers({});
    setSchedule([...prioritySlice, ...normalSlice]);
    setScheduleUnsaved(true);
  }, [tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent, showNotification, t]);

  const generateSchedule = useCallback(() => {
    if (scheduleUnsaved && schedule?.length > 0) {
      unsavedProceedRef.current = doGenerate;
      setShowUnsavedWarning(true);
      return;
    }
    doGenerate();
  }, [scheduleUnsaved, schedule, doGenerate]);

  const handleDateChange = useCallback((newDate) => {
    if (scheduleUnsaved) {
      unsavedProceedRef.current = () => setSelectedDate(newDate);
      setShowUnsavedWarning(true);
    } else {
      setSelectedDate(newDate);
    }
  }, [scheduleUnsaved]);

  const saveSchedule = useCallback(() => {
    if (schedule && schedule.length > 0) {
      try {
        writeScheduleForDate(dateKey, schedule);
        setScheduleUnsaved(false);
        showNotification(t.scheduleSaved);
      } catch {
        showNotification(t.scheduleError);
      }
    }
  }, [schedule, dateKey, showNotification, t]);

  const handleUnsavedSaveAndContinue = useCallback(() => {
    saveSchedule();
    unsavedProceedRef.current?.();
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, [saveSchedule]);

  const handleUnsavedDiscard = useCallback(() => {
    unsavedProceedRef.current?.();
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, []);

  const handleUnsavedCancel = useCallback(() => {
    unsavedProceedRef.current = null;
    setShowUnsavedWarning(false);
  }, []);

  const scheduleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleScheduleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSchedule((prev) => {
      const from = prev.findIndex((t) => t.id === active.id);
      const to = prev.findIndex((t) => t.id === over.id);
      return arrayMove(prev, from, to);
    });
  }, []);

  const handleMarkScheduleItemDone = useCallback((taskId) => {
    const task = schedule?.find((t) => t.id === taskId);
    if (!task) return;
    if (runningTaskId === taskId) setRunningTaskId(null);
    markTaskDone(dateKey, taskId);
    setSchedule((prev) => prev?.map((t) => t.id === taskId ? { ...t, done: true } : t) ?? null);
  }, [schedule, runningTaskId, markTaskDone, dateKey]);

  const handleRemoveScheduleItem = useCallback((taskId) => {
    setSchedule((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      return next.length > 0 ? next : null;
    });
    setScheduleUnsaved(true);
  }, []);

  const deleteSchedule = useCallback(() => {
    try {
      writeScheduleForDate(dateKey, null);
      setSchedule(null);
      setScheduleUnsaved(false);
      showNotification(t.scheduleDeleted);
    } catch {
      showNotification(t.scheduleDeleteError);
    }
  }, [dateKey, showNotification, t]);

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

  const removeTaskFromSchedule = useCallback((predicate) => {
    setSchedule(prev => {
      if (!prev) return null;
      const next = prev.filter(t => !predicate(t));
      return next.length > 0 ? next : null;
    });
    const existing = readAllSchedules()[dateKey];
    if (existing) {
      writeScheduleForDate(dateKey, existing.filter(t => !predicate(t)));
    }
  }, [dateKey]);

  const handleDeleteTask = useCallback((id) => {
    const task = (tasks[dateKey] || []).find((t) => t.id === id);
    if (task?.recurringId) {
      deleteRecurring(task.recurringId);
      deleteAllByRecurringId(task.recurringId);
      removeTaskFromSchedule(t => t.recurringId === task.recurringId);
    } else {
      deleteTask(dateKey, id);
      removeTaskFromSchedule(t => t.id === id);
    }
  }, [tasks, dateKey, deleteRecurring, deleteAllByRecurringId, deleteTask, removeTaskFromSchedule]);

  const handleEditTask = useCallback(() => {
    editTask(dateKey, editTaskId, editTaskText, editTaskImage, editTaskPriority);
    if (editTaskTargetDate && editTaskTargetDate !== dateKey) {
      moveTask(dateKey, editTaskTargetDate, editTaskId);
      removeTaskFromSchedule(t => t.id === editTaskId);
      // Clear elapsed timer for this task so the target date starts at 0
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
  }, [editTaskId, editTaskText, editTaskImage, editTaskPriority, editTaskRecurrence, editTaskStartDate, editTaskMonthsAhead, editTaskYearsAhead, editTaskEndDate, editTaskTargetDate, tasks, dateKey, editTask, moveTask, updateRecurring, addRecurring, linkRecurring, deleteRecurring, deleteAllByRecurringId, resetEditModal, removeTaskFromSchedule]);

  // ─── Import / Export handlers ───────────────────────────────────────────────
  const handleImportFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset the input so the same file can be picked again if needed
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
  const isCustomLayout = JSON.stringify(columnLayout) !== JSON.stringify(DEFAULT_LAYOUT);

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
      {/* Mobile-only top toolbar — sits in normal document flow, no overlap */}
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
            onSaveToBank={(task) => { addToBank(task.text, task.priority); showNotification(t.saveToList); }}
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
                onClick={generateSchedule}
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
      {/* Mobile-only bottom toolbar — export / import / clear / reset layout */}
      <div className="flex lg:hidden items-center justify-between gap-2 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all"
            title={t.exportTitle}
          >
            <span className="material-symbols-outlined text-sm">backup</span>
            {t.exportBtn}
          </button>
          <button
            onClick={() => { setImportError(""); importFileRef.current?.click(); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all"
            title={t.importTitle}
          >
            <span className="material-symbols-outlined text-sm">restore</span>
            {t.importBtn}
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-sm transition-all"
            title={t.clearTitle}
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            {t.clearBtn}
          </button>
        </div>
        {isCustomLayout && (
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t.resetLayoutBtn}
          </button>
        )}
      </div>

      {/* Theme toggle + language + Help — desktop fixed top-right */}
      <div className="hidden lg:flex fixed top-5 right-5 z-40 items-center gap-2">
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center justify-center w-9 h-9 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl hover:bg-surface-container-high shadow-lg transition-all"
          title={t.howStudyflowWorks}
          aria-label="Help"
        >
          <span className="material-symbols-outlined text-base">help_outline</span>
        </button>
        {/* Language toggle */}
        <div className="flex items-center bg-surface-container border border-outline-variant/50 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "en" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("bg")}
            className={`px-3 py-2 text-xs font-semibold transition-colors ${lang === "bg" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-high"}`}
          >
            БГ
          </button>
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
      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <Confetti active={showConfetti} />
      {/* Reset layout button — desktop only, fixed bottom-right */}
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
      {timerTask && (
        <TimerModal
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onPlayPause={toggleTimer}
          onClose={closeTimer}
          onRestart={restartTimer}
          onMarkDone={markTimerTaskDone}
          music={timerMusic}
          pomodoroEnabled={pomodoroEnabled}
          setPomodoroEnabled={setPomodoroEnabled}
          pomodoroMinutes={pomodoroMinutes}
          setPomodoroMinutes={handleSetPomodoroMinutes}
          pomodoroResetAt={pomodoroResetAt}
          pomodoroBreakCount={pomodoroBreakCount}
        />
      )}
      {/* Quick-timer prompt for unscheduled tasks */}
      {pendingTimerTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-xs p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-headline font-bold text-on-surface text-base leading-tight line-clamp-2">
                {pendingTimerTask.text}
              </h3>
              <p className="text-xs text-on-surface-variant">{t.howManyMinutes}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="480"
                value={pendingTimerMinutes}
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
              <button
                onClick={() => setPendingTimerTask(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
                  openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
                  setPendingTimerTask(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all"
              >
                {t.startTimerBtn}
              </button>
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
              addTaskDirect(dateKey, {
                id: generateId(),
                text,
                priority: !!priority,
                imageUrl: imageUrl || "",
                done: false,
              })
            );
            setShowTaskBankModal(false);
            // If triggered from Generate Schedule, auto-generate after state flushes
            if (taskBankModalAutoGenerate) setTimeout(generateSchedule, 0);
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
      {/* Bottom-left actions — export, import, clear — desktop only */}
      <div className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2">
        <button
          onClick={exportData}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all"
          title={t.exportTitle}
        >
          <span className="material-symbols-outlined text-sm">backup</span>
          {t.exportBtn}
        </button>
        <button
          onClick={() => { setImportError(""); importFileRef.current?.click(); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all"
          title={t.importTitle}
        >
          <span className="material-symbols-outlined text-sm">restore</span>
          {t.importBtn}
        </button>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-lg transition-all"
          title={t.clearTitle}
        >
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          {t.clearBtn}
        </button>
      </div>
      {/* Hidden file input for import */}
      <input
        ref={importFileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFileChange}
      />
      {/* Import error toast */}
      {importError && (
        <div className="fixed bottom-20 left-6 z-50 bg-error text-white px-4 py-3 rounded-xl shadow-lg text-xs font-semibold max-w-xs">
          {importError}
        </div>
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
              <button
                onClick={() => setPendingImport(null)}
                className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all text-sm"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleImportConfirm}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-all text-sm"
              >
                {t.restore}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Unsaved schedule warning modal */}
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
              <button
                onClick={handleUnsavedCancel}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleUnsavedDiscard}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all"
              >
                {t.discardAndContinue}
              </button>
              <button
                onClick={handleUnsavedSaveAndContinue}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all"
              >
                {t.saveAndContinue}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Clear all data — confirmation modal */}
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
              <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2 mt-1">
                {t.cannotUndo}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all"
              >
                {t.clearConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
