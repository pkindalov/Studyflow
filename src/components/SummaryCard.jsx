function SummaryCard({ total, completed, remaining, progress, onAddClick }) {
  // Calculate stroke offset for circular progress
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <section className="bg-surface-container rounded-2xl p-8 border border-outline-variant/50 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden group">
      {/* Subtle background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-headline-sm font-headline font-semibold text-on-surface mb-1">
              Focus Progress
            </h3>
            <p className="text-body-lg text-on-surface-variant">
              You're making great progress today.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                Total
              </span>
              <span className="text-3xl font-headline font-bold text-on-surface">
                {total}
              </span>
            </div>
            <div className="flex flex-col border-l border-outline-variant/20 pl-10">
              <span className="text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                Completed
              </span>
              <span className="text-3xl font-headline font-bold text-secondary">
                {completed.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col border-l border-outline-variant/20 pl-10">
              <span className="text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                Remaining
              </span>
              <span className="text-3xl font-headline font-bold text-primary">
                {remaining.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
        {/* Circular Progress Indicator */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            width="128"
            height="128"
          >
            <circle
              className="text-surface-container-highest"
              cx="64"
              cy="64"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className="text-primary"
              cx="64"
              cy="64"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-headline font-bold text-on-surface">
              {progress}%
            </span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
              Done
            </span>
          </div>
        </div>
      </div>
      {/* Floating Add Task Button (optional, can be removed if not needed) */}
      {/*
      <button
        onClick={onAddClick}
        className="absolute top-8 right-8 bg-primary text-on-primary rounded-xl px-4 py-2 font-semibold flex items-center gap-2 shadow-sm hover:opacity-90 transition-all"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span>Add Task</span>
      </button>
      */}
    </section>
  );
}

export default SummaryCard;
