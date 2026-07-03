import { useMemo } from "react";
import { useLang } from "../i18n/LangContext";

const WEEKS = 26;

// Maps done-task count to a CSS class (heatmap-N uses secondary token so it respects the theme)
const cellClass = function(count, isFuture) {
  if (isFuture) return "bg-transparent";
  if (!count) return "bg-surface-container-highest";
  if (count === 1) return "heatmap-1";
  if (count === 2) return "heatmap-2";
  if (count <= 4) return "heatmap-3";
  return "heatmap-4";
}

const buildGrid = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Step back 25 full weeks then align to Sunday so the last column ends on/after today
  const firstSunday = new Date(today);
  firstSunday.setDate(firstSunday.getDate() - (25 * 7 + today.getDay()));

  const weeks = [];
  const cur = new Date(firstSunday);

  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return { weeks, today };
}

const buildMonthLabels = function(weeks, lang) {
  const dateLocale = lang === "bg" ? "bg-BG" : "en-US";
  const labels = [];
  weeks.forEach((week, wIdx) => {
    const first = week[0];
    const prev = wIdx > 0 ? weeks[wIdx - 1][0] : null;
    if (!prev || first.getMonth() !== prev.getMonth()) {
      labels.push({ wIdx, label: first.toLocaleDateString(dateLocale, { month: "short" }) });
    }
  });
  return labels;
}

const formatTooltip = function(date, count, lang, t) {
  const dateLocale = lang === "bg" ? "bg-BG" : "en-US";
  const label = date.toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" });
  if (!count) return `${label} · ${t.heatmapNoTasksDone}`;
  return `${label} · ${t.selectedDayTasksFn(count)}`;
}

const ActivityHeatmap = function({ heatmap, selectedDate, onSelectDate }) {
  const { lang, t } = useLang();
  const { weeks, today } = useMemo(() => buildGrid(), []);
  const monthLabels = useMemo(() => buildMonthLabels(weeks, lang), [weeks, lang]);

  return (
    <div className="flex flex-col gap-1 overflow-x-auto">
      {/* Month labels */}
      <div className="relative h-4 flex-shrink-0">
        <div className="flex gap-[2px]">
          {weeks.map((week, wIdx) => {
            const label = monthLabels.find((m) => m.wIdx === wIdx);
            return (
              <div key={wIdx} className="w-2 flex-shrink-0 relative">
                {label && (
                  <span className="absolute left-0 text-[9px] text-on-surface-variant/60 whitespace-nowrap leading-none">
                    {label.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cell grid — flex row of week columns */}
      <div className="flex gap-[2px]">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="flex flex-col gap-[2px]">
            {week.map((date, dIdx) => {
              const isFuture = date > today;
              const dateStr = date.toLocaleDateString("en-CA");
              const count = heatmap[dateStr] || 0;
              const isSelected = selectedDate === dateStr;
              const isInteractive = !isFuture && onSelectDate !== undefined;
              const tooltip = isFuture ? "" : formatTooltip(date, count, lang, t);
              return (
                <div
                  key={dIdx}
                  title={tooltip}
                  role={isInteractive ? "button" : undefined}
                  tabIndex={isInteractive ? 0 : undefined}
                  aria-label={isInteractive ? tooltip : undefined}
                  onClick={isInteractive ? () => onSelectDate(isSelected ? null : dateStr) : undefined}
                  onKeyDown={isInteractive ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectDate(isSelected ? null : dateStr);
                    }
                  } : undefined}
                  className={[
                    "relative w-2 h-2 rounded-[2px] flex-shrink-0 transition-opacity",
                    cellClass(count, isFuture),
                    // before:-inset-px caps the click target's expansion at the 2px inter-cell gap so it never overlaps a neighbouring day
                    isInteractive ? "cursor-pointer hover:opacity-80 before:absolute before:content-[''] before:-inset-px" : "",
                    isSelected ? "ring-1 ring-primary ring-offset-[1px] ring-offset-surface-container" : "",
                  ].join(" ")}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-1 justify-end">
        <span className="text-[9px] text-on-surface-variant/50">{t.heatmapLessLabel}</span>
        {["bg-surface-container-highest", "heatmap-1", "heatmap-2", "heatmap-3", "heatmap-4"].map((cls, i) => (
          <div key={i} className={`w-2 h-2 rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[9px] text-on-surface-variant/50">{t.heatmapMoreLabel}</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
