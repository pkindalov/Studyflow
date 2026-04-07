import "./calendar.css";
import "./animations.css";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import CalendarSidebar from "./components/CalendarSidebar";
import SummaryCard from "./components/SummaryCard";
import RightSidebar from "./components/RightSidebar";
import { useTasks } from "./hooks/useTasks";
import { markDateWithTasks } from "./utils/calendar";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskImage, setNewTaskImage] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskImage, setEditTaskImage] = useState("");

  const [isGridView, setIsGridView] = useState(false);

  const { tasks, addTask, toggleTask, deleteTask, editTask } = useTasks();

  const formatDateKey = (date) => date.toLocaleDateString("en-CA");
  const dateKey = formatDateKey(selectedDate);

  const tasksForDay = tasks[dateKey] || [];

  const totalTasks = tasksForDay.length;
  const completedTasks = tasksForDay.filter((t) => t.done).length;
  const remainingTasks = totalTasks - completedTasks;

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleAddTask = (text, image) => {
    addTask(dateKey, text, image);
  };

  const handleToggle = (id) => {
    toggleTask(dateKey, id);
  };

  const handleDelete = (id) => {
    deleteTask(dateKey, id);
  };

  const handleEdit = (id, text, image) => {
    editTask(dateKey, id, text, image);
  };

  const openEditModal = (task) => {
    setEditTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskImage(task.imageUrl || "");
    setIsEditModalOpen(true);
  };

  const markDateWithTasksFn = markDateWithTasks(tasks, formatDateKey);

  return (
    <div className="font-body text-on-surface antialiased min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Sidebar (fixed) */}
      <CalendarSidebar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        markDateWithTasks={markDateWithTasksFn}
        onAddClick={() => setIsModalOpen(true)}
      />

      {/* Main Content Canvas */}
      <main className="ml-72 p-12 max-w-[1200px] mx-auto min-h-screen">
        {/* Header Section */}
        <header className="flex flex-col gap-6 mb-12">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <h1 className="text-display-lg font-headline font-extrabold text-on-surface tracking-[-0.02em] text-5xl">
                Daily Plan
              </h1>
              <p className="text-on-surface-variant font-medium text-lg">
                {selectedDate.toLocaleDateString()}
              </p>
            </div>
            <div className="flex bg-surface-container-low p-1 rounded-xl shadow-inner">
              <button
                className="px-4 py-2 bg-surface-bright rounded-lg shadow-sm text-on-surface flex items-center gap-2"
                onClick={() => setIsGridView(false)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  grid_view
                </span>
                <span className="text-sm font-semibold">Grid</span>
              </button>
              <button
                className="px-4 py-2 text-on-surface-variant flex items-center gap-2 hover:bg-surface-container-high rounded-lg transition-all"
                onClick={() => setIsGridView(true)}
              >
                <span className="material-symbols-outlined text-[20px]">
                  format_list_bulleted
                </span>
                <span className="text-sm font-semibold">List</span>
              </button>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-12 gap-8">
          {/* Summary Area (Left 8 cols) */}
          <div className="col-span-8 flex flex-col gap-8">
            <SummaryCard
              total={totalTasks}
              completed={completedTasks}
              remaining={remainingTasks}
              progress={progress}
              onAddClick={() => setIsModalOpen(true)}
            />
            <TaskList
              tasks={tasksForDay}
              isGridView={isGridView}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={openEditModal}
            />
          </div>
          {/* Right Sidebar (Calendar, Inspiration, Projects) */}
          <div className="col-span-4 flex flex-col gap-8">
            <RightSidebar
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              markDateWithTasks={markDateWithTasksFn}
            />
          </div>
        </div>
      </main>

      {/* Add Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewTaskText("");
          setNewTaskImage("");
        }}
        onSave={() => {
          if (newTaskText.trim()) {
            handleAddTask(newTaskText, newTaskImage);
            setIsModalOpen(false);
            setNewTaskText("");
            setNewTaskImage("");
          }
        }}
        text={newTaskText}
        setText={setNewTaskText}
        image={newTaskImage}
        setImage={setNewTaskImage}
        title="New Task"
      />

      {/* Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={() => {
          handleEdit(editTaskId, editTaskText, editTaskImage);
          setIsEditModalOpen(false);
          setEditTaskId(null);
          setEditTaskText("");
          setEditTaskImage("");
        }}
        text={editTaskText}
        setText={setEditTaskText}
        image={editTaskImage}
        setImage={setEditTaskImage}
        title="Edit Task"
      />

      {/* Floating Action Button */}
      <button
        className="fixed bottom-12 right-12 w-20 h-20 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        onClick={() => setIsModalOpen(true)}
        aria-label="Add Task"
      >
        <span className="material-symbols-outlined text-4xl">add</span>
      </button>
    </div>
  );
}

export default App;
