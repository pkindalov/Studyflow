import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarSidebar({
  selectedDate,
  setSelectedDate,
  markDateWithTasks,
  onAddClick,
}) {
  return (
    <aside className="flex flex-col p-5 sm:p-6 gap-5 rounded-3xl bg-surface-container border border-outline-variant/50 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo-192.png"
            alt="Studyflow logo"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <div className="flex flex-col">
            <span className="font-headline font-bold text-lg text-on-surface leading-none">
              Studyflow
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Productivity Ritual
            </span>
          </div>
        </div>
      </div>
      <button
        className="w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(149,128,245,0.3)] text-sm"
        onClick={onAddClick}
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span>Create Task</span>
      </button>
      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={markDateWithTasks}
        className="react-calendar-custom"
      />
    </aside>
  );
}

export default CalendarSidebar;
