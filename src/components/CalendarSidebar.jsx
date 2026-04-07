function CalendarSidebar({ onAddClick }) {
  return (
    <aside className="fixed left-0 top-0 flex flex-col p-6 gap-8 h-screen w-72 rounded-r-3xl bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-xl no-border shadow-[0_20px_40px_rgba(42,52,57,0.06)] font-['Inter'] leading-[1.6] text-sm z-50">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined">architecture</span>
          </div>
          <div className="flex flex-col">
            <span className="font-['Manrope'] font-bold text-lg text-[#5f5e5e] leading-none">
              The Architect
            </span>
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Productivity Ritual
            </span>
          </div>
        </div>
      </div>
      <button
        className="w-full py-3 px-4 bg-primary text-on-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
        onClick={onAddClick}
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span>Create Task</span>
      </button>
      <nav className="flex flex-col gap-1 mt-4">
        <a
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 text-[#5f5e5e] dark:text-white font-bold rounded-xl shadow-sm transition-all duration-300 ease-in-out hover:translate-x-1"
          href="#"
        >
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Today</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 ease-in-out hover:translate-x-1"
          href="#"
        >
          <span className="material-symbols-outlined">event_upcoming</span>
          <span>Upcoming</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 ease-in-out hover:translate-x-1"
          href="#"
        >
          <span className="material-symbols-outlined">folder_open</span>
          <span>Projects</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 ease-in-out hover:translate-x-1"
          href="#"
        >
          <span className="material-symbols-outlined">auto_awesome_motion</span>
          <span>Habits</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300 ease-in-out hover:translate-x-1"
          href="#"
        >
          <span className="material-symbols-outlined">delete</span>
          <span>Trash</span>
        </a>
      </nav>
      <div className="mt-auto flex flex-col gap-1 border-t border-outline-variant/10 pt-4">
        <a
          className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 rounded-xl transition-all"
          href="#"
        >
          <span className="material-symbols-outlined text-sm">
            help_outline
          </span>
          <span>Help</span>
        </a>
        <a
          className="flex items-center gap-3 px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 rounded-xl transition-all"
          href="#"
        >
          <span className="material-symbols-outlined text-sm">fingerprint</span>
          <span>Privacy</span>
        </a>
      </div>
    </aside>
  );
}

export default CalendarSidebar;
