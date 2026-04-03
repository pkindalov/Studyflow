import "./calendar.css";
import "./animations.css";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import { useTasks } from "./hooks/useTasks";

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

  const hasTasks = (date) => {
    const key = formatDateKey(date);
    return tasks[key] && tasks[key].length > 0;
  };

  const markDateWithTasks = (date, view) => {
    return view === "month" && hasTasks(date) ? (
      <div className="flex justify-center mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white/70 backdrop-blur-xl border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 shadow-sm">
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Calendar
        </h2>

        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="react-calendar-clean"
            tileContent={({ date, view }) => markDateWithTasks(date, view)}
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 p-4 md:p-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                Daily Plan
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {selectedDate.toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => setIsGridView((prev) => !prev)}
              className="w-full md:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
            >
              {isGridView ? "📋 List" : "🔲 Grid"}
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto bg-gray-900 text-white px-5 py-2 rounded-xl hover:bg-black transition shadow-sm"
              >
                + Add Task
              </button>

              <span className="text-sm text-gray-500 font-medium">
                {progress}% completed
              </span>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gray-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>📊 {totalTasks} total</span>
              <span>✅ {completedTasks}</span>
              <span>⏳ {remainingTasks}</span>
            </div>
          </div>

          {/* Tasks */}
          <TaskList
            tasks={tasksForDay}
            isGridView={isGridView}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={openEditModal}
          />
        </div>
      </div>

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
    </div>
  );
}

export default App;
