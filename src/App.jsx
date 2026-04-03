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
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Calendar</h2>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="rounded-lg border border-gray-200 p-2"
          tileContent={({ date, view }) => markDateWithTasks(date, view)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">
                Daily Plan
              </h1>
              <p className="text-gray-500 text-sm">
                {selectedDate.toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => setIsGridView((prev) => !prev)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {isGridView ? "📋 List" : "🔲 Grid"}
            </button>
          </div>

          {/* Summary */}
          <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black transition"
              >
                + Add Task
              </button>

              <span className="text-sm text-gray-500">
                {progress}% completed
              </span>
            </div>

            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gray-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-sm text-gray-600 flex gap-4">
              <span>Total: {totalTasks}</span>
              <span>Done: {completedTasks}</span>
              <span>Left: {remainingTasks}</span>
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
