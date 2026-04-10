import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import TimerModal from "./components/TimerModal";
import CalendarSidebar from "./components/CalendarSidebar";
import SummaryCard from "./components/SummaryCard";
import RightSidebar from "./components/RightSidebar";
import MusicPanel from "./components/MusicPanel";
import { useTasks } from "./hooks/useTasks";
import { useMusicPlayer } from "./hooks/useMusicPlayer";
import { useRecurringTasks, appliesToDate } from "./hooks/useRecurringTasks";
import { markDateWithTasks } from "./utils/calendar";
import "./calendar.css";
import "./animations.css";

// Pure helpers — no state dependency, live outside the component
const formatDateKey = (date) => date.toLocaleDateString("en-CA");

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

  const { tasks, addTask, addTaskDirect, toggleTask, markTaskDone, deleteTask, editTask, linkRecurring, deleteAllByRecurringId, moveTask, reorderTasks } = useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring } = useRecurringTasks();
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
    () => markDateWithTasks(tasks, formatDateKey, recurringTasks),
    [tasks, recurringTasks],
  );

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

  // ─── Countdown interval — pure increment, no side-effects ──────────────────
  useEffect(() => {
    if (!runningTaskId) return;
    const task = (schedule && schedule.find((t) => t.id === runningTaskId)) || timerTask;
    if (!task) return;
    const totalSeconds = task.scheduledMinutes * 60;
    const taskId = runningTaskId;
    const interval = setInterval(() => {
      setScheduleTimers((prev) => {
        const elapsed = prev[taskId] || 0;
        if (elapsed >= totalSeconds) return prev;
        return { ...prev, [taskId]: elapsed + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTaskId, schedule, timerTask]);

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
    }
  }, [scheduleTimers, runningTaskId, schedule, timerTask, dateKey, markTaskDone, pomodoroEnabled, pomodoroMinutes, pomodoroResetAt]);

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
        id: crypto.randomUUID(),
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

  // ─── Timer controls ─────────────────────────────────────────────────────────
  const openTimer = useCallback((task) => {
    setTimerTask(task);
    setTaskAllocations((prev) => ({ ...prev, [task.id]: task.scheduledMinutes }));
    const elapsed = scheduleTimers[task.id] || 0;
    if (elapsed < task.scheduledMinutes * 60) {
      setRunningTaskId(task.id);
      music.play();
    }
  }, [scheduleTimers, music]);

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

  const toggleTimer = useCallback(() => {
    if (!timerTask) return;
    if (runningTaskId === timerTask.id) {
      setRunningTaskId(null);
      music.pause();
    } else {
      const elapsed = scheduleTimers[timerTask.id] || 0;
      if (elapsed < timerTask.scheduledMinutes * 60) {
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
    const selectedTasks = tasksForDay.filter((t) => !excludedTaskIds.has(t.id) && !t.done);
    if (!selectedTasks.length || totalStudyTime <= 0) return;
    const priorityTasks = selectedTasks.filter((t) => t.priority);
    const nonPriorityTasks = selectedTasks.filter((t) => !t.priority);
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
        priorityTasks.forEach((t, i) => {
          const time = i === priorityTasks.length - 1 ? left : minPerTask;
          scheduleArr.push({ ...t, scheduledMinutes: time });
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
        nonPriorityTasks.forEach((t, i) => {
          const time = i === nonPriorityTasks.length - 1 ? left : minPerTask;
          scheduleArr.push({ ...t, scheduledMinutes: time });
          left -= time;
        });
      }
    }

    const prioritySlice = scheduleArr.filter((t) => t.priority).sort(() => Math.random() - 0.5);
    const normalSlice = scheduleArr.filter((t) => !t.priority).sort(() => Math.random() - 0.5);
    setSchedule([...prioritySlice, ...normalSlice]);
  }, [tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent]);

  const saveSchedule = useCallback(() => {
    if (schedule && schedule.length > 0) {
      try {
        localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(schedule));
        showNotification("Schedule saved successfully!");
      } catch {
        showNotification("Error saving schedule.");
      }
    }
  }, [schedule, dateKey, showNotification]);

  const deleteSchedule = useCallback(() => {
    try {
      localStorage.removeItem(`schedule_${dateKey}`);
      setSchedule(null);
      showNotification("Schedule deleted.");
    } catch {
      showNotification("Error deleting schedule.");
    }
  }, [dateKey, showNotification]);

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
    } else {
      deleteTask(dateKey, id);
    }
  }, [tasks, dateKey, deleteRecurring, deleteAllByRecurringId, deleteTask]);

  const handleEditTask = useCallback(() => {
    editTask(dateKey, editTaskId, editTaskText, editTaskImage, editTaskPriority);
    if (editTaskTargetDate && editTaskTargetDate !== dateKey) {
      moveTask(dateKey, editTaskTargetDate, editTaskId);
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
  }, [editTaskId, editTaskText, editTaskImage, editTaskPriority, editTaskRecurrence, editTaskStartDate, editTaskMonthsAhead, editTaskYearsAhead, editTaskEndDate, editTaskTargetDate, tasks, dateKey, editTask, moveTask, updateRecurring, addRecurring, linkRecurring, deleteRecurring, deleteAllByRecurringId, resetEditModal]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c1a] p-4 sm:p-6 pt-6">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg font-semibold animate-fade-in text-sm text-center max-w-[90vw]">
          {notification}
        </div>
      )}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-3">
          <CalendarSidebar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            markDateWithTasks={markDateWithTasksFn}
            onAddClick={() => { setNewTaskStartDate(dateKey); setIsModalOpen(true); }}
          />
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
            onToggle={(id) => toggleTask(dateKey, id)}
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
                Generate Schedule
              </button>
            </div>
          )}
          {schedule && (
            <>
              <div className="mt-8 bg-surface-container rounded-2xl border border-outline-variant/50 p-6">
                <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  Today's Schedule
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
                        <span className="text-xs text-on-surface-variant font-mono">{task.scheduledMinutes} min</span>
                        {task.priority && (
                          <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase ml-1">Priority</span>
                        )}
                        <button
                          onClick={() => openTimer(task)}
                          title={isFinished ? "Completed" : isRunning ? "Running — click to view" : hasProgress ? "Resume timer" : "Start timer"}
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
                  Save Schedule
                </button>
                <button
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl font-semibold hover:bg-error/20 transition-all flex items-center justify-center gap-2 text-sm"
                  onClick={deleteSchedule}
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
        {/* Right Sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4 lg:gap-6">
          <RightSidebar
            totalStudyTime={totalStudyTime}
            setTotalStudyTime={setTotalStudyTime}
            priorityPercent={priorityPercent}
            setPriorityPercent={setPriorityPercent}
            tasks={tasks}
            recurringTasks={recurringTasks}
            tasksForDay={tasksForDay}
            scheduleTimers={scheduleTimers}
            taskAllocations={taskAllocations}
          />
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
        </div>
      </div>
      {/* Timer Modal */}
      {timerTask && (
        <TimerModal
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onPlayPause={toggleTimer}
          onClose={closeTimer}
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
              <p className="text-xs text-on-surface-variant">How many minutes do you want to work on this?</p>
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
              <span className="text-sm text-on-surface-variant">min</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingTimerTask(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setScheduleTimers((prev) => ({ ...prev, [pendingTimerTask.id]: 0 }));
                  openTimer({ ...pendingTimerTask, scheduledMinutes: pendingTimerMinutes });
                  setPendingTimerTask(null);
                }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all"
              >
                Start
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
        title={isEditing ? "Edit Task" : "Add New Task"}
      />
    </div>
  );
}

export default App;
