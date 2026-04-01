import "./calendar.css";
import "./animations.css";
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Load tasks from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("studyflow_tasks");
    if (saved) setTasks(JSON.parse(saved));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded)
      localStorage.setItem("studyflow_tasks", JSON.stringify(tasks));
  }, [tasks, isLoaded]);

  const formatDateKey = function (date) {
    return date.toLocaleDateString("en-CA");
  };

  const taskInputRef = useRef(null);
  const dateKey = formatDateKey(selectedDate);

  const tasksForDay = tasks[dateKey] || [];
  const totalTasks = tasksForDay.length;
  const completedTasks = tasksForDay.filter((t) => t.done).length;
  const remainingTasks = totalTasks - completedTasks;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const addTask = function (text) {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [
        ...(prev[dateKey] || []),
        { id: crypto.randomUUID(), text, done: false },
      ],
    }));
  };

  const toggleTask = function (id) {
    setTasks((prev) => {
      const currentTasks = prev[dateKey] || [];

      const updatedTasks = currentTasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task,
      );

      return {
        ...prev,
        [dateKey]: updatedTasks,
      };
    });
  };

  const deleteTask = function (id) {
    const element = document.getElementById(`task-${id}`);
    if (element) {
      element.classList.add("fade-out");
      setTimeout(() => {
        setTasks((prev) => {
          const currentTasks = prev[dateKey] || [];
          const updatedTasks = currentTasks.filter((task) => task.id !== id);

          return {
            ...prev,
            [dateKey]: updatedTasks,
          };
        });
      }, 180);
    }
  };

  const handleAddingTask = function () {
    const input = taskInputRef.current;
    if (input && input.value.trim()) {
      addTask(input.value.trim());
      input.value = "";
    }
  };

  const hasTasks = function (date) {
    const tasksDate = formatDateKey(date);
    return tasks[tasksDate] && tasks[tasksDate].length > 0;
  };

  const markDateWithTasks = function (date, view) {
    return view === "month" && hasTasks(date) ? (
      <div className="flex justify-center mt-1">
        <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
      </div>
    ) : null;
  };

  const startEditing = function (task) {
    setEditingId(task.id);
    setEditingText(task.text);
  };

  const saveEditing = function () {
    if (!editingId) return;

    setTasks((prev) => {
      const currentTasks = prev[dateKey] || [];

      const updatedTasks = currentTasks.map((task) =>
        task.id === editingId ? { ...task, text: editingText } : task,
      );

      return {
        ...prev,
        [dateKey]: updatedTasks,
      };
    });

    setEditingId(null);
    setEditingText("");
  };

  const cancelEditing = function () {
    setEditingId(null);
    setEditingText("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Calendar</h2>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="rounded-lg shadow-sm"
          tileContent={({ date, view }) => markDateWithTasks(date, view)}
        />
      </div>

      {/* Right content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Daily Plan</h1>
        <p className="text-gray-600">
          Selected Date: {selectedDate.toLocaleDateString()}
        </p>
        <div className="flex gap-2 mb-4">
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
        </div>

        <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              Daily Summary
            </h2>
            <span className="text-sm text-gray-500">{progress}% done</span>
          </div>

          {/* Progress bar */}
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

        {tasks[dateKey].length > 0 && (
          <p className="text-xs text-gray-400 mb-2">
            Double‑click a task to edit it, or use the pencil icon.
          </p>
        )}

        <ul className="space-y-2">
          {(tasks[dateKey] || []).map((task) => (
            <li
              id={`task-${task.id}`}
              key={task.id}
              className="fade-slide-in bg-white shadow-sm p-3 rounded-lg border border-gray-100 flex items-center gap-3 transition hover:shadow-lg hover:border-pink-100"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />

              {editingId === task.id ? (
                <input
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={saveEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditing();
                    if (e.key === "Escape") cancelEditing();
                  }}
                  className="flex-1 border rounded px-2 py-1 text-gray-700"
                />
              ) : (
                <span
                  onDoubleClick={() => startEditing(task)}
                  className={`flex-1 ${
                    task.done ? "line-through text-gray-400" : "text-gray-700"
                  } cursor-text`}
                >
                  {task.text}
                </span>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => startEditing(task)}
                  className="text-gray-400 hover:text-blue-500 transition text-lg leading-none"
                  title="Edit task"
                >
                  ✎
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-400 hover:text-pink-500 transition text-lg leading-none"
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
