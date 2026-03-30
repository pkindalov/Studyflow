import "./calendar.css";
import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState({});

  const addTask = function (text) {
    const dateKey = selectedDate.toISOString().split("T")[0];

    setTasks((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), text],
    }));
  };

  const handleAddingTask = function () {
    const input = document.getElementById("taskInput");
    if (input.value.trim()) {
      addTask(input.value.trim());
      input.value = "";
    }
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
            id="taskInput"
            placeholder="New task..."
            className="border rounded-lg px-3 py-2 flex-1"
          />
          <button
            onClick={handleAddingTask}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {(tasks[selectedDate.toISOString().split("T")[0]] || []).map(
            (task, i) => (
              <li
                key={i}
                className="bg-white shadow-sm p-3 rounded-lg border border-gray-100"
              >
                {task}
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

export default App;
