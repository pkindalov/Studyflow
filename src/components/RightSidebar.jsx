function RightSidebar({
  totalStudyTime,
  setTotalStudyTime,
  priorityPercent,
  setPriorityPercent,
}) {
  return (
    <>
      {/* Total Study Time Card */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-xl text-primary">
            schedule
          </span>
          <span className="font-headline font-bold text-on-surface text-lg">
            Total Study Time
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={24}
            step={0.25}
            value={totalStudyTime}
            onChange={(e) => setTotalStudyTime(Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-highest text-on-surface font-semibold text-base focus:outline-none focus:ring-2 focus:ring-primary/60 border-outline/60"
          />
          <span className="text-on-surface-variant font-medium">hours</span>
        </div>
      </section>
      {/* Priority Percent Setting */}
      <section className="bg-surface-container rounded-2xl p-5 border border-outline-variant/50 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-xl text-secondary">
            star
          </span>
          <span className="font-headline font-bold text-on-surface text-lg">
            Priority Time Limit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={priorityPercent}
            onChange={(e) =>
              setPriorityPercent(
                Math.max(0, Math.min(100, Number(e.target.value))),
              )
            }
            className="w-20 px-3 py-2 rounded-xl border border-outline/60 bg-surface-container-highest text-on-surface font-semibold text-base focus:outline-none focus:ring-2 focus:ring-secondary/60"
          />
          <span className="text-on-surface-variant font-medium">
            % of total time
          </span>
        </div>
        <span className="text-xs text-on-surface-variant">
          Max percent of study time that can be allocated to priority tasks.
        </span>
      </section>
      {/* Daily Inspiration Card */}
      <section className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-4">
          <span className="material-symbols-outlined text-3xl text-primary/60">
            format_quote
          </span>
          <p className="font-headline font-medium text-base leading-relaxed italic text-on-surface">
            "The secret of getting ahead is getting started."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-primary/40"></div>
            <span className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant">
              Mark Twain
            </span>
          </div>
        </div>
      </section>
      {/* Mini Project List */}
      <section className="flex flex-col gap-3">
        <h3 className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase px-1">
          Active Projects
        </h3>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="font-medium text-sm text-on-surface">Product Launch</span>
            </div>
            <span className="text-xs text-on-surface-variant font-semibold tabular-nums">
              85%
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-secondary"></div>
              <span className="font-medium text-sm text-on-surface">Brand Redesign</span>
            </div>
            <span className="text-xs text-on-surface-variant font-semibold tabular-nums">
              42%
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-tertiary"></div>
              <span className="font-medium text-sm text-on-surface">Quarterly Audit</span>
            </div>
            <span className="text-xs text-on-surface-variant font-semibold tabular-nums">
              12%
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

export default RightSidebar;
