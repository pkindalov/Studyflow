import { useActivityStats } from "../../../shared/hooks/useActivityStats";
import ActivityHeatmap from "../../../shared/components/ActivityHeatmap";
import { useLang } from "../../../shared/i18n/LangContext";

function formatFocusTime(totalSeconds, t) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return { value: "0", unit: t.minUnit };
  if (h === 0) return { value: String(m), unit: t.minUnit };
  if (m === 0) return { value: String(h), unit: h === 1 ? t.hourUnit : t.hoursUnit2 };
  return { value: `${h}h ${m}m`, unit: null };
}

export function ActivityPanel({ tasks }) {
  const { t } = useLang();
  const { streak, activeToday, totalFocusSeconds, todayFocusSeconds, heatmap } = useActivityStats(tasks);
  const focus = formatFocusTime(totalFocusSeconds, t);
  const todayFocus = formatFocusTime(todayFocusSeconds, t);

  const totalDone = Object.values(heatmap).reduce((sum, n) => sum + n, 0);

  return (
    <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-xl text-primary">local_fire_department</span>
        <span className="font-headline font-bold text-on-surface text-lg">{t.activityLabel}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Streak */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">
            {t.streakLabel}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-on-surface tabular-nums leading-none">
              {streak}
            </span>
            <span className="text-xs text-on-surface-variant">{t.daysUnit}</span>
          </div>
          {streak === 0 && (
            <span className="text-[10px] text-on-surface-variant/60 mt-0.5 leading-tight">
              {t.startStreakMsg}
            </span>
          )}
          {streak > 0 && activeToday && (
            <span className="text-[10px] text-secondary font-semibold mt-0.5">
              {t.activeTodayMsg}
            </span>
          )}
          {streak > 0 && !activeToday && (
            <span className="text-[10px] text-tertiary font-semibold mt-0.5">
              {t.keepGoingMsg}
            </span>
          )}
        </div>

        {/* Today's focus */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">
            {t.todayFocusLabel}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-primary tabular-nums leading-none">
              {todayFocus.value}
            </span>
            {todayFocus.unit && (
              <span className="text-xs text-on-surface-variant">{todayFocus.unit}</span>
            )}
          </div>
          <span className="text-[10px] text-on-surface-variant/60 mt-0.5">{t.focusTimeLabel}</span>
        </div>

        {/* Total focus time */}
        <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">
            {t.totalUnit}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-on-surface tabular-nums leading-none">
              {focus.value}
            </span>
            {focus.unit && (
              <span className="text-xs text-on-surface-variant">{focus.unit}</span>
            )}
          </div>
          <span className="text-[10px] text-on-surface-variant/60 mt-0.5">
            {t.tasksCompletedFn(totalDone)}
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant px-0.5">
          {t.last6Months}
        </span>
        <ActivityHeatmap heatmap={heatmap} />
      </div>
    </section>
  );
}
