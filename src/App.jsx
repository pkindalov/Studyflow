import "./calendar.css";
import "./animations.css";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const saved = localStorage.getItem("studyflow_tasks");
    if (saved) setTasks(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("studyflow_tasks", JSON.stringify(tasks));
    }
  }, [tasks, isLoaded]);

  const formatDateKey = (date) => date.toLocaleDateString("en-CA");

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
          <ul
            className={
              isGridView ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "space-y-3"
            }
          >
            {tasksForDay.map((task) => (
              <li
                key={task.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition"
              >
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {task.imageUrl ? (
                    <img
                      src={task.imageUrl}
                      alt=""
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-3xl">📌</span>
                  )}
                </div>

                <div className="p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 accent-gray-900"
                  />

                  <div className="flex-1">
                    <span
                      onDoubleClick={() => openEditModal(task)}
                      className={`text-sm cursor-pointer ${
                        task.done
                          ? "line-through text-gray-400"
                          : "text-gray-800"
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  <div className="flex gap-2 text-gray-400">
                    <button
                      onClick={() => openEditModal(task)}
                      className="hover:text-gray-700"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">New Task</h2>

            <input
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task description..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <input
              value={newTaskImage}
              onChange={(e) => setNewTaskImage(e.target.value)}
              placeholder="Image URL (optional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (newTaskText.trim()) {
                    addTask(newTaskText, newTaskImage);
                    setIsModalOpen(false);
                    setNewTaskText("");
                    setNewTaskImage("");
                  }
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[90%] max-w-md border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Edit Task</h2>

            <input
              value={editTaskText}
              onChange={(e) => setEditTaskText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <input
              value={editTaskImage}
              onChange={(e) => setEditTaskImage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={saveEditedTask}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
