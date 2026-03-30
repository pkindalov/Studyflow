import { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left sidebar */}
      <div className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">Календар</h2>

        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="rounded-lg shadow-sm"
        />
      </div>

      {/* Right content */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Програма за деня</h1>
        <p className="text-gray-600">
          Избрана дата: {selectedDate.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default App;
