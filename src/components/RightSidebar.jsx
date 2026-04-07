import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function RightSidebar({ selectedDate, setSelectedDate, markDateWithTasks }) {
  return (
    <>
      {/* Compact Calendar Component */}
      <section className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-[0_10px_30px_rgba(42,52,57,0.04)]">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-headline font-bold text-on-surface">
            {selectedDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <div className="flex gap-2">
            {/* Navigation buttons can be implemented if needed */}
            <button className="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-lg">
                chevron_left
              </span>
            </button>
            <button className="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-lg">
                chevron_right
              </span>
            </button>
          </div>
        </div>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          className="react-calendar-clean"
          tileContent={({ date, view }) => markDateWithTasks(date, view)}
        />
      </section>
      {/* Daily Inspiration Card */}
      <section className="bg-secondary-dim text-on-secondary rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-[60px]"></div>
        </div>
        <div className="relative z-10 flex flex-col gap-6">
          <span className="material-symbols-outlined text-4xl opacity-50">
            format_quote
          </span>
          <p className="font-headline font-semibold text-xl leading-relaxed italic">
            "The secret of getting ahead is getting started."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-1 bg-secondary-container/40"></div>
            <span className="text-sm uppercase tracking-widest font-bold opacity-70">
              Mark Twain
            </span>
          </div>
        </div>
      </section>
      {/* Mini Project List */}
      <section className="flex flex-col gap-4">
        <h3 className="text-label-md font-bold tracking-[0.1em] text-on-surface-variant uppercase px-2">
          Active Projects
        </h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="font-semibold text-sm">Product Launch</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              85%
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span className="font-semibold text-sm">Brand Redesign</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              42%
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-tertiary"></div>
              <span className="font-semibold text-sm">Quarterly Audit</span>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              12%
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export default RightSidebar;
