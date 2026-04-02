import "./calendar.css";
import "./animations.css";
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskImage, setNewTaskImage] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskImage, setEditTaskImage] = useState("");

  const [isGridView, setIsGridView] = useState(false);

  const taskInputRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studyflow_tasks");
    if (saved) setTasks(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("studyflow_tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const formatDateKey = (date) => {
    return date.toLocaleDateString("en-CA");
  };

  const dateKey = formatDateKey(selectedDate);
  const tasksForDay = tasks[dateKey] || [];

  const totalTasks = tasksForDay.length;
  const completedTasks = tasksForDay.filter((t) => t.done).length;
  const remainingTasks = totalTasks - completedTasks;

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const addTask = (text, imageUrl = "") => {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        {
          id: crypto.randomUUID(),
          text,
          done: false,
          imageUrl,
        },
      ],
    }));
  };

  const toggleTask = (id) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      );

      return { ...prev, [dateKey]: updated };
    });
  };

  const deleteTask = (id) => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).filter((task) => task.id !== id);

      return { ...prev, [dateKey]: updated };
    });
  };

  const openEditModal = (task) => {
    setEditTaskId(task.id);
    setEditTaskText(task.text);
    setEditTaskImage(task.imageUrl || "");
    setIsEditModalOpen(true);
  };

  const saveEditedTask = () => {
    setTasks((prev) => {
      const updated = (prev[dateKey] || []).map((task) =>
        task.id === editTaskId
          ? { ...task, text: editTaskText, imageUrl: editTaskImage }
          : task,
      );

      return { ...prev, [dateKey]: updated };
    });

    setIsEditModalOpen(false);
    setEditTaskId(null);
    setEditTaskText("");
    setEditTaskImage("");
  };

  const handleAddingTask = () => {
    const input = taskInputRef.current;
    if (input && input.value.trim()) {
      addTask(input.value.trim());
      input.value = "";
    }
  };

  const hasTasks = (date) => {
    const key = formatDateKey(date);
    return tasks[key] && tasks[key].length > 0;
  };

  const markDateWithTasks = (date, view) => {
    return view === "month" && hasTasks(date) ? (
      <div className="flex justify-center mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Calendar</h2>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="rounded-lg shadow-sm"
          tileContent={({ date, view }) => markDateWithTasks(date, view)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Daily Plan </h1>
        <button
          onClick={() => setIsGridView((prev) => !prev)}
          className="mb-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          {isGridView ? "📋 List" : "🔲 Grid"}
        </button>

        <p className="text-gray-600 mb-4">
          Selected Date: {selectedDate.toLocaleDateString()}
        </p>

        {/* Quick add */}
        {/* <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New task..."
            className="border rounded-lg px-3 py-2 flex-1"
            ref={taskInputRef}
          />
          <button
            onClick={handleAddingTask}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Add
          </button>
        </div> */}

        {/* Summary */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            >
              Add Task
            </button>

            <h2 className="text-lg font-semibold text-gray-800">
              Daily Summary
            </h2>

            <span className="text-sm text-gray-500">{progress}% done</span>
          </div>

          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="text-sm text-gray-600 flex gap-4">
            <span>Total: {totalTasks}</span>
            <span>Completed: {completedTasks}</span>
            <span>Remaining: {remainingTasks}</span>
          </div>
        </div>

        {/* Tasks */}
        <ul
          className={
            isGridView ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "space-y-2"
          }
        >
          {tasksForDay.map((task) => (
            <li
              key={task.id}
              className="fade-slide-in bg-white shadow-md rounded-xl border border-gray-100 overflow-hidden transition hover:shadow-lg"
            >
              <div className="w-full h-32 overflow-hidden bg-pink-100 flex items-center justify-center">
                {task.imageUrl ? (
                  <img
                    src={task.imageUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-4xl">📌</span>
                )}
              </div>

              <div className="p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 accent-pink-500"
                />

                <div className="flex-1">
                  <span
                    onDoubleClick={() => openEditModal(task)}
                    className={`block cursor-pointer ${
                      task.done ? "line-through text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {task.text}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEditModal(task)}>✎</button>
                  <button onClick={() => deleteTask(task.id)}>✕</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md">
            <h2 className="text-xl mb-4">Add Task</h2>

            <input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task..."
              className="w-full border mb-2 p-2"
            />

            <input
              value={newTaskImage}
              onChange={(e) => setNewTaskImage(e.target.value)}
              placeholder="Image URL"
              className="w-full border mb-4 p-2"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>

              <button
                onClick={() => {
                  if (newTaskText.trim()) {
                    addTask(newTaskText, newTaskImage);
                    setIsModalOpen(false);
                    setNewTaskText("");
                    setNewTaskImage("");
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[90%] max-w-md">
            <h2 className="text-xl mb-4">Edit Task</h2>

            <input
              value={editTaskText}
              onChange={(e) => setEditTaskText(e.target.value)}
              className="w-full border mb-2 p-2"
            />

            <input
              value={editTaskImage}
              onChange={(e) => setEditTaskImage(e.target.value)}
              className="w-full border mb-4 p-2"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>

              <button onClick={saveEditedTask}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
