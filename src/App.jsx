import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import CalendarSidebar from "./components/CalendarSidebar";
import SummaryCard from "./components/SummaryCard";
import RightSidebar from "./components/RightSidebar";
import { useTasks } from "./hooks/useTasks";
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskImage, setEditTaskImage] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState(false);

  const isEditing = isEditModalOpen;

  const formatDateKey = (date) => date.toLocaleDateString("en-CA");
  const dateKey = formatDateKey(selectedDate);

  // Schedule state
  const [schedule, setSchedule] = useState(null);

  // Load saved schedule from localStorage on date change
  React.useEffect(() => {
    const saved = localStorage.getItem(`schedule_${dateKey}`);
    if (saved) {
      setSchedule(JSON.parse(saved));
    } else {
      setSchedule(null);
    }
  }, [dateKey]);

  const { tasks, addTask, toggleTask, deleteTask, editTask } = useTasks();

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

  const handleAddTask = (text, image, priority) => {
    addTask(dateKey, text, image, priority);
    setIsModalOpen(false);
    setNewTaskText("");
    setNewTaskImage("");
    setNewTaskPriority(false);
  };

  const handleEditTask = (text, image, priority) => {
    editTask(dateKey, editTaskId, text, image, priority);
    setIsEditModalOpen(false);
    setEditTaskId(null);
    setEditTaskText("");
    setEditTaskImage("");
    setEditTaskPriority(false);
  };

  // Helper for marking dates with tasks (fix signature for calendar dot)
  const markDateWithTasksFn = markDateWithTasks(tasks, formatDateKey);

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
            onAddClick={() => setIsModalOpen(true)}
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
            onDelete={(id) => deleteTask(dateKey, id)}
            onEdit={(task) => {
              setEditTaskId(task.id);
              setEditTaskText(task.text);
              setEditTaskImage(task.imageUrl || "");
              setEditTaskPriority(task.priority);
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
                  {schedule.map((task, idx) => (
                    <li
                      key={task.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50"
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${task.priority ? "bg-tertiary" : "bg-on-surface-variant"}`}
                      ></span>
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
                    </li>
                  ))}
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
        </div>
      </div>
      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen || isEditModalOpen}
        onClose={() => {
          if (isModalOpen) setIsModalOpen(false);
          if (isEditModalOpen) setIsEditModalOpen(false);
        }}
        onSave={isEditing ? handleEditTask : handleAddTask}
        text={isEditing ? editTaskText : newTaskText}
        setText={isEditing ? setEditTaskText : setNewTaskText}
        image={isEditing ? editTaskImage : newTaskImage}
        setImage={isEditing ? setEditTaskImage : setNewTaskImage}
        priority={isEditing ? editTaskPriority : newTaskPriority}
        setPriority={isEditing ? setEditTaskPriority : setNewTaskPriority}
        title={isEditing ? "Edit Task" : "Add New Task"}
      />
    </div>
  );
}

export default App;
