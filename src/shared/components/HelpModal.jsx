function Section({ icon, title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-primary">{icon}</span>
        <h3 className="font-headline font-bold text-on-surface text-sm">{title}</h3>
      </div>
      <div className="pl-6 flex flex-col gap-1.5 text-xs text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <p className="flex gap-2">
      <span className="text-primary/60 flex-shrink-0">›</span>
      <span>{children}</span>
    </p>
  );
}

function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col max-h-[92dvh]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-primary">help</span>
            <h2 className="font-headline font-bold text-on-surface text-lg">How Studyflow works</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-6">

          <Section icon="task_alt" title="Creating tasks">
            <Tip>Tap <strong className="text-on-surface">Create Task</strong> in the calendar sidebar to add a task for the selected date.</Tip>
            <Tip>Each task can have a <strong className="text-on-surface">name</strong>, optional <strong className="text-on-surface">image URL</strong>, and a <strong className="text-on-surface">priority</strong> flag (starred tasks get more schedule time).</Tip>
            <Tip>Double-click a task name to edit it instantly.</Tip>
            <Tip>Use the <strong className="text-on-surface">move to date</strong> option in the edit modal to reschedule a task to a different day.</Tip>
          </Section>

          <Section icon="repeat" title="Recurring tasks">
            <Tip>When creating a task, set a repeat pattern — <strong className="text-on-surface">Daily, Weekly, Monthly, Yearly</strong>, or a <strong className="text-on-surface">Custom</strong> date range.</Tip>
            <Tip>Recurring tasks appear automatically on every matching date in the calendar.</Tip>
            <Tip>The <strong className="text-on-surface">stop repeating</strong> button (repeat_off icon) removes all future instances without deleting past ones.</Tip>
          </Section>

          <Section icon="schedule" title="Generating a schedule">
            <Tip>Select the tasks you want to include using the <strong className="text-on-surface">calendar tick</strong> icon on each task card.</Tip>
            <Tip>Set your <strong className="text-on-surface">total study hours</strong> and <strong className="text-on-surface">priority time limit</strong> in the sidebar — Studyflow divides your time across tasks automatically.</Tip>
            <Tip>Hit <strong className="text-on-surface">Generate Schedule</strong> — done tasks are automatically skipped.</Tip>
            <Tip>You can drag schedule items to reorder them, then <strong className="text-on-surface">save</strong> the schedule so it persists after refresh.</Tip>
          </Section>

          <Section icon="timer" title="Focus timer">
            <Tip>Click the <strong className="text-on-surface">play</strong> button on any scheduled task to start a countdown timer.</Tip>
            <Tip>You can also start a quick timer on any task directly from the task list — you'll be asked how many minutes you want to work on it.</Tip>
            <Tip>The timer pauses and resumes. Progress is saved automatically — if you close and reopen the timer, it picks up where it left off.</Tip>
            <Tip>When time is up the task is marked as done. Hit <strong className="text-on-surface">Restart</strong> if you need another round.</Tip>
          </Section>

          <Section icon="self_improvement" title="Pomodoro mode">
            <Tip>Inside the timer modal, toggle <strong className="text-on-surface">Pomodoro</strong> on to automatically pause after a set number of minutes (default 25).</Tip>
            <Tip>When a pomodoro break triggers, the timer stops — take your break, then press play to start the next cycle.</Tip>
          </Section>

          <Section icon="headphones" title="Focus music">
            <Tip>Add any <strong className="text-on-surface">YouTube URL</strong> to your playlist from the Music panel in the sidebar.</Tip>
            <Tip>Music plays automatically when the focus timer starts and pauses when it stops.</Tip>
            <Tip>Pick a track from inside the timer modal too — the playlist is always accessible there.</Tip>
          </Section>

          <Section icon="drag_indicator" title="Drag & drop">
            <Tip>Drag task cards to <strong className="text-on-surface">reorder</strong> them within the day.</Tip>
            <Tip>Drag schedule items to reorder the focus session.</Tip>
            <Tip>Drag sidebar panels (calendar, music, progress…) between the <strong className="text-on-surface">left and right columns</strong> using the move icon that appears on hover.</Tip>
            <Tip>Click <strong className="text-on-surface">Reset layout</strong> (bottom-right) to restore the default column arrangement.</Tip>
          </Section>

          <Section icon="storage" title="Your data & privacy">
            <Tip>All data — tasks, schedules, timers, playlists, layout — is stored in your <strong className="text-on-surface">browser's localStorage</strong>. Nothing is sent to any server.</Tip>
            <Tip>Because of this, data is <strong className="text-on-surface">per device and per browser</strong>. Switching browsers or devices means starting fresh.</Tip>
            <Tip>Clearing browser data or site storage will erase everything.</Tip>
            <Tip>Use <strong className="text-on-surface">Clear all data</strong> (bottom-left button) if you want to reset the app completely — this action cannot be undone.</Tip>
          </Section>

          <Section icon="light_mode" title="Light & dark theme">
            <Tip>Toggle between dark and light mode with the <strong className="text-on-surface">sun/moon button</strong> in the top-right corner. Your preference is remembered.</Tip>
          </Section>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between gap-4">
          <p className="text-[10px] text-on-surface-variant/60">
            Data lives in your browser — no account needed.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
