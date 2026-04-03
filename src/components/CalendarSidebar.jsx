import Calendar from "react-calendar";

function CalendarSidebar({ selectedDate, setSelectedDate, markDateWithTasks }) {
  return (
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
  );
}

export default CalendarSidebar;
