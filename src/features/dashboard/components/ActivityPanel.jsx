import { useState, useMemo } from "react";
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

function ActivityStatsGrid({ streak, activeToday, todayFocus, focus, totalDone, t }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">{t.streakLabel}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-on-surface tabular-nums leading-none">{streak}</span>
          <span className="text-xs text-on-surface-variant">{t.daysUnit}</span>
        </div>
        {streak === 0 && <span className="text-[10px] text-on-surface-variant/60 mt-0.5 leading-tight">{t.startStreakMsg}</span>}
        {streak > 0 && activeToday && <span className="text-[10px] text-secondary font-semibold mt-0.5">{t.activeTodayMsg}</span>}
        {streak > 0 && !activeToday && <span className="text-[10px] text-tertiary font-semibold mt-0.5">{t.keepGoingMsg}</span>}
      </div>

      <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">{t.todayFocusLabel}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-primary tabular-nums leading-none">{todayFocus.value}</span>
          {todayFocus.unit && <span className="text-xs text-on-surface-variant">{todayFocus.unit}</span>}
        </div>
        <span className="text-[10px] text-on-surface-variant/60 mt-0.5">{t.focusTimeLabel}</span>
      </div>

      <div className="bg-surface-container-high rounded-xl p-3 flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">{t.totalUnit}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-on-surface tabular-nums leading-none">{focus.value}</span>
          {focus.unit && <span className="text-xs text-on-surface-variant">{focus.unit}</span>}
        </div>
        <span className="text-[10px] text-on-surface-variant/60 mt-0.5">{t.tasksCompletedFn(totalDone)}</span>
      </div>
    </div>
  );
}

function SelectedDayDetail({ selectedDate, selectedFocus, doneTasks, onDeselect, t }) {
  const dateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return (
    <div className="bg-surface-container-high rounded-xl px-3 py-2.5 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-primary leading-none">calendar_today</span>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate">{t.selectedDayLabel}</span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-on-surface">{dateLabel}</span>
            <span className="text-[10px] text-on-surface-variant/70">·</span>
            <span className="text-xs font-bold text-primary tabular-nums">
              {selectedFocus.value}
              {selectedFocus.unit && <span className="text-xs font-normal text-on-surface-variant ml-0.5">{selectedFocus.unit}</span>}
            </span>
            <span className="text-[10px] text-on-surface-variant/70">·</span>
            <span className="text-[10px] text-on-surface-variant">{t.selectedDayTasksFn(doneTasks.length)}</span>
          </div>
        </div>
        <button onClick={onDeselect} aria-label="Deselect" className="text-on-surface-variant/50 hover:text-on-surface-variant transition-colors leading-none text-base material-symbols-outlined flex-shrink-0" title="Deselect">
          close
        </button>
      </div>

      {doneTasks.length > 0 ? (
        <ul className="flex flex-col gap-1 max-h-40 overflow-y-auto overscroll-contain">
          {doneTasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 bg-surface-container rounded-lg px-2 py-1.5">
              <span className="material-symbols-outlined text-sm text-tertiary flex-shrink-0 leading-none">check_circle</span>
              <span className="flex-1 text-xs text-on-surface truncate">{task.text}</span>
              {task.priority && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-tertiary flex-shrink-0">{t.priorityBadge}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-on-surface-variant/60 pl-6">{t.heatmapNoTasksDone}</p>
      )}
    </div>
  );
}

export function ActivityPanel({ tasks }) {
  const { t } = useLang();
  const { streak, activeToday, totalFocusSeconds, todayFocusSeconds, heatmap } = useActivityStats(tasks);
  const focus = formatFocusTime(totalFocusSeconds, t);
  const todayFocus = formatFocusTime(todayFocusSeconds, t);
  const [selectedDate, setSelectedDate] = useState(null);

  const selectedFocusSeconds = useMemo(() => {
    if (!selectedDate) return 0;
    try {
      const allTimers = JSON.parse(localStorage.getItem("studyflow_schedule_timers") || "{}");
      const timers = allTimers[selectedDate];
      if (!timers || typeof timers !== "object") return 0;
      return Object.values(timers).reduce((sum, sec) => sum + (typeof sec === "number" && sec > 0 ? sec : 0), 0);
    } catch { return 0; }
  }, [selectedDate]);

  const selectedDoneTasks = useMemo(
    () => (selectedDate ? (tasks[selectedDate] || []).filter((task) => task.done) : []),
    [selectedDate, tasks]
  );

  const totalDone = Object.values(heatmap).reduce((sum, n) => sum + n, 0);
  const selectedFocus = selectedDate ? formatFocusTime(selectedFocusSeconds, t) : null;

  return (
    <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-xl text-primary">local_fire_department</span>
        <span className="font-headline font-bold text-on-surface text-lg">{t.activityLabel}</span>
      </div>

      <ActivityStatsGrid streak={streak} activeToday={activeToday} todayFocus={todayFocus} focus={focus} totalDone={totalDone} t={t} />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant px-0.5">{t.last6Months}</span>
        <ActivityHeatmap heatmap={heatmap} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {selectedDate && (
        <SelectedDayDetail
          selectedDate={selectedDate}
          selectedFocus={selectedFocus}
          doneTasks={selectedDoneTasks}
          onDeselect={() => setSelectedDate(null)}
          t={t}
        />
      )}
    </section>
  );
}
