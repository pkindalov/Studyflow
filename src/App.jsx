import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { exportData, readBackupFile, applyBackup } from "./shared/utils/dataPortability";
import { useLang } from "./shared/i18n/LangContext";
import "./features/calendar/calendar.css";
import "./animations.css";

// Pure helpers — no state dependency, live outside the component
const formatDateKey = (date) => date.toLocaleDateString("en-CA");

const DEFAULT_LAYOUT = { left: ["calendar", "activity"], right: ["studyTime", "priorityPercent", "quote", "todaysTasks", "music"] };

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
  const [draggedSection, setDraggedSection] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const sectionDragOverRef = useRef(null);

  // Schedule state
  const [schedule, setSchedule] = useState(null);
  const [scheduleDraggedId, setScheduleDraggedId] = useState(null);
  const scheduleDragOverRef = useRef(null);

  // Timer state
  const [timerTask, setTimerTask] = useState(null);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [scheduleTimers, setScheduleTimers] = useState({});
  // Maps taskId → scheduledMinutes so RightSidebar can show live progress
  const [taskAllocations, setTaskAllocations] = useState({});

  // Refs for wall-clock timer (survive tab-switch throttling)
  const scheduleTimersRef = useRef({});
  const timerStartRef = useRef(null); // { startedAt, baseElapsed, taskId, totalSeconds }

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

  const { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks, clearAllTasks } = useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring, clearAllRecurring } = useRecurringTasks();
  const music = useMusicPlayer();

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

  const markDateWithTasksFn = useMemo(
    () => markDateWithTasks(tasks, formatDateKey, recurringTasks, showCalendarCompletion),
    [tasks, recurringTasks, showCalendarCompletion],
  );

  // ─── Column layout persistence & handlers ───────────────────────────────────
  useEffect(() => {
    localStorage.setItem("studyflow_column_layout", JSON.stringify(columnLayout));
  }, [columnLayout]);

  const handleSectionEnter = useCallback((targetId) => {
    if (!draggedSection || targetId === draggedSection || targetId === sectionDragOverRef.current) return;
    sectionDragOverRef.current = targetId;
    setColumnLayout((prev) => {
      // Remove dragged from wherever it is
      const withoutDragged = {
        left: prev.left.filter((id) => id !== draggedSection),
        right: prev.right.filter((id) => id !== draggedSection),
      };
      // Find which column the target lives in now
      const targetCol = withoutDragged.left.includes(targetId) ? "left" : "right";
      const list = [...withoutDragged[targetCol]];
      const targetIdx = list.indexOf(targetId);
      if (targetIdx === -1) return prev;
      list.splice(targetIdx, 0, draggedSection);
      return { ...withoutDragged, [targetCol]: list };
    });
  }, [draggedSection]);

  const handleDropOnColumn = useCallback((col) => {
    // Fallback: if user drops on empty column area (not over a section)
    if (!draggedSection) return;
    setColumnLayout((prev) => {
      if (prev[col].includes(draggedSection)) return prev; // already there via handleSectionEnter
      return {
        left:  col === "left"  ? [...prev.left, draggedSection]  : prev.left.filter((id) => id !== draggedSection),
        right: col === "right" ? [...prev.right, draggedSection] : prev.right.filter((id) => id !== draggedSection),
      };
    });
    setDraggedSection(null);
    setDropTarget(null);
  }, [draggedSection]);

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
    // Wipe all schedule_* and schedule_timers_* keys from localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith("schedule_"))
      .forEach((k) => localStorage.removeItem(k));
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
    const saved = localStorage.getItem(`schedule_${dateKey}`);
    setSchedule(saved ? JSON.parse(saved) : null);
    const savedTimers = localStorage.getItem(`schedule_timers_${dateKey}`);
    setScheduleTimers(savedTimers ? JSON.parse(savedTimers) : {});
    setRunningTaskId(null);
    setTimerTask(null);
  }, [dateKey]);

  useEffect(() => {
    localStorage.setItem(`schedule_timers_${dateKey}`, JSON.stringify(scheduleTimers));
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
      return;
    }
    const pomodoroSeconds = pomodoroEnabled ? Math.max(1, pomodoroMinutes) * 60 : 0;
    if (pomodoroSeconds > 0 && elapsed > pomodoroResetAt && (elapsed - pomodoroResetAt) % pomodoroSeconds === 0) {
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
    setTimerTask(task);
    setTaskAllocations((prev) => ({ ...prev, [task.id]: task.scheduledMinutes }));
    const elapsed = scheduleTimers[task.id] || 0;
    if (elapsed < task.scheduledMinutes * 60) {
      setRunningTaskId(task.id);
    }
  }, [scheduleTimers]);

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
  }, [music]);

  const markTimerTaskDone = useCallback(() => {
    if (!timerTask) return;
    setRunningTaskId(null);
    markTaskDone(dateKey, timerTask.id);
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: timerTask.scheduledMinutes * 60 }));
    music.pause();
    setTimerTask(null);
  }, [timerTask, dateKey, markTaskDone, music]);

  const restartTimer = useCallback(() => {
    if (!timerTask) return;
    setScheduleTimers((prev) => ({ ...prev, [timerTask.id]: 0 }));
    setPomodoroResetAt(0);
    toggleTask(dateKey, timerTask.id); // task was force-marked done; toggle it back to undone
    setRunningTaskId(timerTask.id);
    music.play();
  }, [timerTask, dateKey, toggleTask, music]);

  const toggleTimer = useCallback(() => {
    if (!timerTask) return;
    if (runningTaskId === timerTask.id) {
      setRunningTaskId(null);
      music.pause();
    } else {
      const elapsed = scheduleTimers[timerTask.id] || 0;
      if (elapsed < timerTask.scheduledMinutes * 60) {
        // Advance the Pomodoro baseline so the detection effect doesn't
        // immediately re-fire on the already-elapsed boundary (e.g. 1500s % 1500 === 0).
        setPomodoroResetAt(elapsed);
        setRunningTaskId(timerTask.id);
        music.play();
      }
    }
  }, [timerTask, runningTaskId, scheduleTimers, music]);

  const handleSetPomodoroMinutes = useCallback((val) => {
    const currentElapsed = timerTask ? (scheduleTimers[timerTask.id] || 0) : 0;
    setPomodoroResetAt(currentElapsed);
    setPomodoroMinutes(val);
  }, [timerTask, scheduleTimers]);

  // ─── Schedule controls ──────────────────────────────────────────────────────
  const generateSchedule = useCallback(() => {
    const selectedTasks = tasksForDay.filter((task) => !excludedTaskIds.has(task.id) && !task.done);
    if (totalStudyTime <= 0) return;
    if (!selectedTasks.length) {
      const allDone = tasksForDay.length > 0 && tasksForDay.every((task) => task.done);
      showNotification(allDone ? t.allDoneNothing : t.noTasksSelected);
      return;
    }
    const priorityTasks = selectedTasks.filter((task) => task.priority);
    const nonPriorityTasks = selectedTasks.filter((task) => !task.priority);
    let scheduleArr = [];
    const totalMinutes = totalStudyTime * 60;
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
    setSchedule([...prioritySlice, ...normalSlice]);
  }, [tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent, showNotification, t]);

  const saveSchedule = useCallback(() => {
    if (schedule && schedule.length > 0) {
      try {
        localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(schedule));
        showNotification(t.scheduleSaved);
      } catch {
        showNotification(t.scheduleError);
      }
    }
  }, [schedule, dateKey, showNotification, t]);

  const deleteSchedule = useCallback(() => {
    try {
      localStorage.removeItem(`schedule_${dateKey}`);
      setSchedule(null);
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
    const saved = localStorage.getItem(`schedule_${dateKey}`);
    if (saved) {
      try {
        const updated = JSON.parse(saved).filter(t => !predicate(t));
        if (updated.length > 0) {
          localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(updated));
        } else {
          localStorage.removeItem(`schedule_${dateKey}`);
        }
      } catch { /* ignore parse errors */ }
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
        setSelectedDate={setSelectedDate}
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
        onSelectTrack={music.selectTrack}
        onAddTrack={music.addTrack}
        onRemoveTrack={music.removeTrack}
        onTogglePlay={music.togglePlay}
        onSetVolume={music.setVolume}
      />
    ),
  };

  const renderSideSection = (id) => (
    <div
      key={id}
      draggable
      onDragStart={() => { setDraggedSection(id); sectionDragOverRef.current = id; }}
      onDragEnter={() => handleSectionEnter(id)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={() => { setDraggedSection(null); setDropTarget(null); sectionDragOverRef.current = null; }}
      className={`relative group/sec transition-opacity ${draggedSection === id ? "opacity-30" : ""}`}
    >
      <div
        className="absolute top-3 right-3 z-10 opacity-0 group-hover/sec:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-surface-container-highest/80 rounded-lg p-1"
        title={t.dragToMoveHint}
      >
        <span className="material-symbols-outlined text-sm text-on-surface-variant">open_with</span>
      </div>
      {SECTION_JSX[id]}
    </div>
  );

  const sideColClass = (col) =>
    `lg:col-span-3 flex flex-col gap-4 lg:gap-6 rounded-2xl transition-all min-h-16 ${dropTarget === col && draggedSection ? "ring-2 ring-primary/40" : ""}`;

  const sideColDropProps = (col) => ({
    onDragOver: (e) => { e.preventDefault(); setDropTarget(col); },
    onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDropTarget(null); },
    onDrop: () => handleDropOnColumn(col),
  });

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

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Sidebar */}
        <div className={sideColClass("left")} {...sideColDropProps("left")}>
          {columnLayout.left.map(renderSideSection)}
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
              <div className="mt-8 bg-surface-container rounded-2xl border border-outline-variant/50 p-6">
                <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  {t.todaysSchedule}
                </h3>
                <ul className="flex flex-col gap-3">
                  {schedule.map((task) => {
                    const elapsed = scheduleTimers[task.id] || 0;
                    const total = task.scheduledMinutes * 60;
                    const isRunning = runningTaskId === task.id;
                    const isFinished = total > 0 && elapsed >= total;
                    const hasProgress = elapsed > 0 && !isFinished;
                    const isDragging = scheduleDraggedId === task.id;
                    return (
                      <li
                        key={task.id}
                        draggable
                        onDragStart={() => { setScheduleDraggedId(task.id); scheduleDragOverRef.current = task.id; }}
                        onDragEnter={() => {
                          if (!scheduleDraggedId || task.id === scheduleDragOverRef.current) return;
                          scheduleDragOverRef.current = task.id;
                          setSchedule((prev) => {
                            const list = [...prev];
                            const from = list.findIndex((t) => t.id === scheduleDraggedId);
                            const to = list.findIndex((t) => t.id === task.id);
                            if (from === -1 || to === -1) return prev;
                            const [moved] = list.splice(from, 1);
                            list.splice(to, 0, moved);
                            return list;
                          });
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnd={() => { setScheduleDraggedId(null); scheduleDragOverRef.current = null; }}
                        className={`relative flex items-center gap-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${isDragging ? "opacity-30" : ""}`}
                      >
                        {(hasProgress || isFinished) && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outline-variant/30">
                            <div
                              className={`h-full transition-all ${isFinished ? "bg-tertiary" : "bg-primary"}`}
                              style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }}
                            />
                          </div>
                        )}
                        <span className="material-symbols-outlined text-base text-on-surface-variant/30 flex-shrink-0 select-none">drag_indicator</span>
                        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${task.priority ? "bg-tertiary" : "bg-on-surface-variant"}`} />
                        <span className="flex-1 font-medium text-on-surface text-sm">{task.text}</span>
                        <span className="text-xs text-on-surface-variant font-mono">{task.scheduledMinutes} {t.minUnit}</span>
                        {task.priority && (
                          <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase ml-1">{t.priorityBadge}</span>
                        )}
                        <button
                          onClick={() => openTimer(task)}
                          title={isFinished ? t.completedStatus : isRunning ? t.runningStatus : hasProgress ? t.resumeTimerStatus : t.startTimerStatus}
                          className={`flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0 ${
                            isFinished
                              ? "bg-tertiary/20 text-tertiary"
                              : isRunning
                                ? "bg-primary/20 text-primary animate-pulse"
                                : hasProgress
                                  ? "bg-secondary/20 text-secondary hover:bg-secondary/30"
                                  : "bg-on-surface-variant/10 text-on-surface-variant hover:bg-on-surface-variant/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            {isFinished ? "check_circle" : isRunning ? "pause_circle" : "play_circle"}
                          </span>
                        </button>
                        <button
                          onClick={() => setSchedule((prev) => {
                            const next = prev.filter((t) => t.id !== task.id);
                            return next.length > 0 ? next : null;
                          })}
                          title="Remove from schedule"
                          className="flex items-center justify-center w-8 h-8 rounded-full transition-all flex-shrink-0 text-on-surface-variant/40 hover:text-error hover:bg-error/10"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
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
        <div className={sideColClass("right")} {...sideColDropProps("right")}>
          {columnLayout.right.map(renderSideSection)}
        </div>
      </div>
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
      {/* Reset layout button — desktop only, fixed bottom-right */}
      {isCustomLayout && (
        <div className="hidden lg:flex fixed bottom-6 right-6 z-40">
          <button
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t.resetLayoutBtn}
          </button>
        </div>
      )}
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
          music={music}
          pomodoroEnabled={pomodoroEnabled}
          setPomodoroEnabled={setPomodoroEnabled}
          pomodoroMinutes={pomodoroMinutes}
          setPomodoroMinutes={handleSetPomodoroMinutes}
          pomodoroResetAt={pomodoroResetAt}
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
