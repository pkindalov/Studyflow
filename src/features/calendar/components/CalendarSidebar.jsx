import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useLang } from "../../../shared/i18n/LangContext";

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-secondary" : "bg-surface-container-highest"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function CalendarSidebar({
  selectedDate,
  setSelectedDate,
  markDateWithTasks,
  onAddClick,
  showCompletion,
  onToggleCompletion,
}) {
  const { t, lang } = useLang();

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
              {t.appName}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              {t.appTagline}
            </span>
          </div>
        </div>
      </div>
      <button
        className="w-full py-2.5 px-4 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_rgba(149,128,245,0.3)] text-sm"
        onClick={onAddClick}
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span>{t.createTask}</span>
      </button>

      {/* Month overview toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-sm text-on-surface-variant flex-shrink-0">
            calendar_month
          </span>
          <span className="text-xs font-medium text-on-surface-variant truncate">
            {t.monthOverview}
          </span>
        </div>
        <ToggleSwitch checked={showCompletion} onChange={onToggleCompletion} />
      </div>

      <Calendar
        onChange={setSelectedDate}
        value={selectedDate}
        tileContent={markDateWithTasks}
        locale={lang === "bg" ? "bg-BG" : "en-US"}
        className="react-calendar-custom"
      />
    </aside>
  );
}

export default CalendarSidebar;
