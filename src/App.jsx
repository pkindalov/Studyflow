import "./calendar.css";
import "./animations.css";
import { useEffect, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

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

  const addTask = function (text) {
    setTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), { text, done: false }],
    }));
  };

  const toggleTask = function (index) {
    setTasks((prev) => {
      const currentTasks = prev[dateKey] || [];

      const updatedTasks = currentTasks.map((task, i) =>
        i === index ? { ...task, done: !task.done } : task,
      );

      return {
        ...prev,
        [dateKey]: updatedTasks,
      };
    });
  };

  const deleteTask = function (index) {
    const element = document.getElementById(`task-${index}`);
    if (element) {
      element.classList.add("fade-out");
      setTimeout(() => {
        setTasks((prev) => {
          const currentTasks = prev[dateKey] || [];
          const updatedTasks = currentTasks.filter((_, i) => i !== index);

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
        <ul className="space-y-2">
          {(tasks[dateKey] || []).map((task, i) => (
            <li
              id={`task-${i}`}
              key={i}
              className="fade-slide-in bg-white shadow-sm p-3 rounded-lg border border-gray-100 flex items-center gap-3 transition hover:shadow-lg hover:border-pink-100"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(i)}
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />

              <span
                className={`flex-1 ${
                  task.done ? "line-through text-gray-400" : "text-gray-700"
                } transition`}
              >
                {task.text}
              </span>
              <button
                onClick={() => deleteTask(i)}
                className="text-gray-400 hover:text-pink-500 transition text-lg leading-none"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
