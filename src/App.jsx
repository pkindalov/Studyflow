import React, { useState } from "react";
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

function App() {
  const [notification, setNotification] = useState("");
  function showNotification(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(""), 2500);
  }
  // Priority percent (how much of total time can be used by priority tasks)
  const [priorityPercent, setPriorityPercent] = useState(40); // default 40%
  const [selectedDate, setSelectedDate] = useState(new Date());

  // New: total study time in hours
  const [totalStudyTime, setTotalStudyTime] = useState(4); // default 4 hours

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

  const isEditing = isEditModalOpen;

  const formatDateKey = (date) => date.toLocaleDateString("en-CA");
  const dateKey = formatDateKey(selectedDate);

  // Schedule state
  const [schedule, setSchedule] = useState(null);

  // Timer state
  const [timerTask, setTimerTask] = useState(null);
  const [runningTaskId, setRunningTaskId] = useState(null);
  const [scheduleTimers, setScheduleTimers] = useState({});

  // Load saved schedule from localStorage on date change
  React.useEffect(() => {
    const saved = localStorage.getItem(`schedule_${dateKey}`);
    if (saved) {
      setSchedule(JSON.parse(saved));
    } else {
      setSchedule(null);
    }
    // Load saved timer progress for this date
    const savedTimers = localStorage.getItem(`schedule_timers_${dateKey}`);
    setScheduleTimers(savedTimers ? JSON.parse(savedTimers) : {});
    // Stop any running timer when switching dates
    setRunningTaskId(null);
    setTimerTask(null);
  }, [dateKey]);

  // Auto-save timer progress to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem(
      `schedule_timers_${dateKey}`,
      JSON.stringify(scheduleTimers),
    );
  }, [scheduleTimers, dateKey]);

  // Countdown interval — ticks every second while a task is running
  React.useEffect(() => {
    if (!runningTaskId || !schedule) return;
    const task = schedule.find((t) => t.id === runningTaskId);
    if (!task) return;
    const totalSeconds = task.scheduledMinutes * 60;
    const interval = setInterval(() => {
      setScheduleTimers((prev) => {
        const elapsed = prev[runningTaskId] || 0;
        if (elapsed >= totalSeconds) return prev;
        const next = elapsed + 1;
        if (next >= totalSeconds) {
          setTimeout(() => setRunningTaskId(null), 10);
        }
        return { ...prev, [runningTaskId]: next };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTaskId, schedule]);

  const music = useMusicPlayer();

  function openTimer(task) {
    setTimerTask(task);
    const elapsed = scheduleTimers[task.id] || 0;
    if (elapsed < task.scheduledMinutes * 60) {
      setRunningTaskId(task.id);
      music.play();
    }
  }

  function closeTimer() {
    setRunningTaskId(null);
    setTimerTask(null);
    music.pause();
  }

  function toggleTimer() {
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
  }

  const { tasks, addTask, addTaskDirect, toggleTask, deleteTask, editTask, linkRecurring, deleteAllByRecurringId } =
    useTasks();
  const { recurringTasks, addRecurring, updateRecurring, deleteRecurring } =
    useRecurringTasks();

  // Auto-populate recurring tasks whenever the date or recurring templates change
  React.useEffect(() => {
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

  const tasksForDay = tasks[dateKey] || [];

  const totalTasks = tasksForDay.length;
  const completedTasks = tasksForDay.filter((t) => t.done).length;
  const remainingTasks = totalTasks - completedTasks;

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Schedule generation logic
  function generateSchedule() {
    if (!tasksForDay.length || totalStudyTime <= 0) return;
    const priorityTasks = tasksForDay.filter((t) => t.priority);
    const nonPriorityTasks = tasksForDay.filter((t) => !t.priority);
    let scheduleArr = [];
    let totalMinutes = totalStudyTime * 60;
    let priorityMinutes = Math.round(
      priorityTasks.length && priorityPercent > 0
        ? (Math.min(priorityPercent, 100) / 100) * totalMinutes
        : 0,
    );
    let nonPriorityMinutes = totalMinutes - priorityMinutes;

    // Edge cases
    if (priorityTasks.length === 0) {
      // All non-priority
      nonPriorityMinutes = totalMinutes;
      priorityMinutes = 0;
    } else if (priorityTasks.length === tasksForDay.length) {
      // All priority
      priorityMinutes = totalMinutes;
      nonPriorityMinutes = 0;
    }

    // Assign time
    if (priorityTasks.length > 0) {
      // If only one priority task, give it all priorityMinutes
      if (priorityTasks.length === 1) {
        scheduleArr.push({
          ...priorityTasks[0],
          scheduledMinutes: priorityMinutes,
        });
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
      // If only one non-priority task, give it all nonPriorityMinutes
      if (nonPriorityTasks.length === 1) {
        scheduleArr.push({
          ...nonPriorityTasks[0],
          scheduledMinutes: nonPriorityMinutes,
        });
      } else {
        const minPerTask = Math.floor(
          nonPriorityMinutes / nonPriorityTasks.length,
        );
        let left = nonPriorityMinutes;
        nonPriorityTasks.forEach((t, i) => {
          const time = i === nonPriorityTasks.length - 1 ? left : minPerTask;
          scheduleArr.push({ ...t, scheduledMinutes: time });
          left -= time;
        });
      }
    }
    // Shuffle for randomness
    scheduleArr = scheduleArr.sort(() => Math.random() - 0.5);
    setSchedule(scheduleArr);
  }

  // Save schedule to localStorage
  function saveSchedule() {
    if (schedule && schedule.length > 0) {
      try {
        localStorage.setItem(`schedule_${dateKey}`, JSON.stringify(schedule));
        showNotification("Schedule saved successfully!");
      } catch (e) {
        showNotification("Error saving schedule.");
      }
    }
  }

  // Delete schedule from localStorage
  function deleteSchedule() {
    try {
      localStorage.removeItem(`schedule_${dateKey}`);
      setSchedule(null);
      showNotification("Schedule deleted.");
    } catch (e) {
      showNotification("Error deleting schedule.");
    }
  }

  function resetAddModal() {
    setIsModalOpen(false);
    setNewTaskText("");
    setNewTaskImage("");
    setNewTaskPriority(false);
    setNewTaskRecurrence("none");
    setNewTaskStartDate("");
    setNewTaskEndDate("");
    setNewTaskMonthsAhead("3");
    setNewTaskYearsAhead("2");
  }

  function resetEditModal() {
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
  }

  // Compute the end date for a recurring task based on mode
  function computeRecurringEndDate(recurrence, startDate, monthsAhead, yearsAhead, customEndDate) {
    const start = new Date((startDate || dateKey) + "T12:00:00");
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

  const handleAddTask = () => {
    const startDate = newTaskStartDate || dateKey;
    if (newTaskRecurrence !== "none") {
      // "custom" stores as daily with user-supplied dates
      const actualRecurrence = newTaskRecurrence === "custom" ? "daily" : newTaskRecurrence;
      const endDate = computeRecurringEndDate(newTaskRecurrence, startDate, newTaskMonthsAhead, newTaskYearsAhead, newTaskEndDate);
      addRecurring(newTaskText, newTaskImage, newTaskPriority, actualRecurrence, startDate, endDate);
    } else {
      addTask(dateKey, newTaskText, newTaskImage, newTaskPriority);
    }
    resetAddModal();
  };

  const handleDeleteTask = (id) => {
    const task = (tasks[dateKey] || []).find((t) => t.id === id);
    if (task?.recurringId) {
      // Remove the template AND every instance across all dates
      deleteRecurring(task.recurringId);
      deleteAllByRecurringId(task.recurringId);
    } else {
      deleteTask(dateKey, id);
    }
  };

  const handleEditTask = () => {
    editTask(dateKey, editTaskId, editTaskText, editTaskImage, editTaskPriority);
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
  };

  // Helper for marking dates with tasks (includes recurring templates)
  const markDateWithTasksFn = markDateWithTasks(tasks, formatDateKey, recurringTasks);

  // Main render
  return (
    <div className="min-h-screen bg-[#0c0c1a] p-4 sm:p-6 pt-6">
      {/* Notification */}
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
              } else {
                setEditTaskRecurrence("none");
                setEditTaskStartDate(dateKey);
                setEditTaskEndDate("");
                setEditTaskIsRecurringInstance(false);
              }
              setIsEditModalOpen(true);
            }}
          />
          {/* Generate Schedule Button */}
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
          {/* Schedule Display and Save/Delete Buttons */}
          {schedule && (
            <>
              <div className="mt-8 bg-surface-container rounded-2xl border border-outline-variant/50 p-6">
                <h3 className="font-headline font-bold text-xl mb-4 flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary">
                    schedule
                  </span>
                  Today's Schedule
                </h3>
                <ul className="flex flex-col gap-3">
                  {schedule.map((task) => {
                    const elapsed = scheduleTimers[task.id] || 0;
                    const total = task.scheduledMinutes * 60;
                    const isRunning = runningTaskId === task.id;
                    const isFinished = total > 0 && elapsed >= total;
                    const hasProgress = elapsed > 0 && !isFinished;
                    return (
                      <li
                        key={task.id}
                        className="relative flex items-center gap-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 overflow-hidden"
                      >
                        {/* Progress underline */}
                        {(hasProgress || isFinished) && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-outline-variant/30">
                            <div
                              className={`h-full transition-all ${isFinished ? "bg-tertiary" : "bg-primary"}`}
                              style={{
                                width: `${Math.min(100, (elapsed / total) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        <span
                          className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${task.priority ? "bg-tertiary" : "bg-on-surface-variant"}`}
                        />
                        <span className="flex-1 font-medium text-on-surface text-sm">
                          {task.text}
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">
                          {task.scheduledMinutes} min
                        </span>
                        {task.priority && (
                          <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase ml-1">
                            Priority
                          </span>
                        )}
                        {/* Play button */}
                        <button
                          onClick={() => openTimer(task)}
                          title={
                            isFinished
                              ? "Completed"
                              : isRunning
                                ? "Running — click to view"
                                : hasProgress
                                  ? "Resume timer"
                                  : "Start timer"
                          }
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
                            {isFinished
                              ? "check_circle"
                              : isRunning
                                ? "pause_circle"
                                : "play_circle"}
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
      {/* Hidden YouTube player mount point */}
      <div
        id="studyflow-yt-player"
        style={{ position: "fixed", top: -9999, left: -9999, width: 2, height: 2, pointerEvents: "none" }}
      />
      {/* Timer Modal */}
      {timerTask && (
        <TimerModal
          task={timerTask}
          elapsedSeconds={scheduleTimers[timerTask.id] || 0}
          isRunning={runningTaskId === timerTask.id}
          onPlayPause={toggleTimer}
          onClose={closeTimer}
          music={music}
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
        title={isEditing ? "Edit Task" : "Add New Task"}
      />
    </div>
  );
}

export default App;
