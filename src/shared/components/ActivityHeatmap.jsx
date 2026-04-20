import { useMemo } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKS = 26;

// Maps done-task count to a Tailwind colour class
function cellClass(count, isFuture) {
  if (isFuture) return "bg-transparent";
  if (!count) return "bg-surface-container-highest";
  if (count === 1) return "bg-emerald-400/40";
  if (count === 2) return "bg-emerald-400/65";
  if (count <= 4) return "bg-emerald-500/85";
  return "bg-emerald-500";
}

function buildGrid() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Anchor the last column's last cell to today.
  // Sunday = 0, so the first cell of the grid is (26*7) + today.getDay() days before
  // the last Sunday of the grid.  Simpler: step back 25 full weeks + align to Sunday.
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

function buildMonthLabels(weeks) {
  const labels = [];
  weeks.forEach((week, wIdx) => {
    const first = week[0];
    const prev = wIdx > 0 ? weeks[wIdx - 1][0] : null;
    if (!prev || first.getMonth() !== prev.getMonth()) {
      labels.push({ wIdx, label: MONTHS[first.getMonth()] });
    }
  });
  return labels;
}

function formatTooltip(date, count) {
  const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (!count) return `${label} · No tasks done`;
  return `${label} · ${count} task${count === 1 ? "" : "s"} done`;
}

function ActivityHeatmap({ heatmap, selectedDate, onSelectDate }) {
  const { weeks, today } = useMemo(buildGrid, []);
  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

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
              return (
                <div
                  key={dIdx}
                  title={isFuture ? "" : formatTooltip(date, count)}
                  onClick={!isFuture && onSelectDate ? () => onSelectDate(isSelected ? null : dateStr) : undefined}
                  className={[
                    "w-2 h-2 rounded-[2px] flex-shrink-0 transition-opacity",
                    cellClass(count, isFuture),
                    !isFuture && onSelectDate ? "cursor-pointer hover:opacity-80" : "",
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
        <span className="text-[9px] text-on-surface-variant/50">Less</span>
        {["bg-surface-container-highest", "bg-emerald-400/40", "bg-emerald-400/65", "bg-emerald-500/85", "bg-emerald-500"].map((cls, i) => (
          <div key={i} className={`w-2 h-2 rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[9px] text-on-surface-variant/50">More</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
