import { useActivityStats } from "../../../shared/hooks/useActivityStats";
import ActivityHeatmap from "../../../shared/components/ActivityHeatmap";

function formatFocusTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return { value: "0", unit: "min" };
  if (h === 0) return { value: String(m), unit: "min" };
  if (m === 0) return { value: String(h), unit: h === 1 ? "hour" : "hours" };
  return { value: `${h}h ${m}m`, unit: "total" };
}

export function ActivityPanel({ tasks }) {
  const { streak, activeToday, totalFocusSeconds, heatmap } = useActivityStats(tasks);
  const focus = formatFocusTime(totalFocusSeconds);

  const totalDone = Object.values(heatmap).reduce((sum, n) => sum + n, 0);

  return (
    <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-xl text-primary">local_fire_department</span>
        <span className="font-headline font-bold text-on-surface text-lg">Activity</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Streak */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
            Streak
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-on-surface tabular-nums leading-none">
              {streak}
            </span>
            <span className="text-xs text-on-surface-variant">days</span>
          </div>
          {streak === 0 && (
            <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
              Complete a task to start
            </span>
          )}
          {streak > 0 && activeToday && (
            <span className="text-[10px] text-secondary font-semibold mt-0.5">
              Active today!
            </span>
          )}
          {streak > 0 && !activeToday && (
            <span className="text-[10px] text-tertiary font-semibold mt-0.5">
              Keep it going!
            </span>
          )}
        </div>

        {/* Focus time */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant">
            Focus time
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-on-surface tabular-nums leading-none">
              {focus.value}
            </span>
            {focus.unit !== "total" && (
              <span className="text-xs text-on-surface-variant">{focus.unit}</span>
            )}
          </div>
          <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
            {totalDone} task{totalDone === 1 ? "" : "s"} completed
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant px-0.5">
          Last 6 months
        </span>
        <ActivityHeatmap heatmap={heatmap} />
      </div>
    </section>
  );
}
