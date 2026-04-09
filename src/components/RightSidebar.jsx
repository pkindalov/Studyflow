import { useState, useMemo } from "react";
import Pagination from "./Pagination";

const MODAL_PAGE_SIZE = 5;
const MAX_VISIBLE = 5;

const ACCENT_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-tertiary",
  "bg-primary/60",
  "bg-secondary/60",
];

function ProgressRow({ label, progress, colorClass, priority }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-surface-container rounded-xl border border-outline-variant/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorClass}`} />
          <span className="font-medium text-sm text-on-surface truncate">{label}</span>
          {priority && (
            <span className="text-[9px] text-tertiary font-bold tracking-wider uppercase flex-shrink-0">
              ★
            </span>
          )}
        </div>
        <span className="text-xs text-on-surface-variant font-semibold tabular-nums flex-shrink-0">
          {progress}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-outline-variant/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RightSidebar({
  totalStudyTime,
  setTotalStudyTime,
  priorityPercent,
  setPriorityPercent,
  tasks,
  recurringTasks,
  tasksForDay,
}) {
  // Hooks always at the top — before any conditional logic
  const [showAll, setShowAll] = useState(false);
  const [modalPage, setModalPage] = useState(0);

  const items = useMemo(() => {
    if (recurringTasks.length > 0) {
      return recurringTasks.map((tpl, idx) => {
        const instances = Object.values(tasks).flat().filter((t) => t.recurringId === tpl.id);
        const done = instances.filter((t) => t.done).length;
        const progress = instances.length > 0 ? Math.round((done / instances.length) * 100) : 0;
        return {
          key: tpl.id,
          label: tpl.text,
          progress,
          priority: tpl.priority,
          colorClass: ACCENT_COLORS[idx % ACCENT_COLORS.length],
        };
      });
    }

    if (tasksForDay.length > 0) {
      const done = tasksForDay.filter((t) => t.done).length;
      const total = tasksForDay.length;
      const taskRows = tasksForDay.map((t, idx) => ({
        key: t.id,
        label: t.text,
        progress: t.done ? 100 : 0,
        priority: t.priority,
        colorClass: ACCENT_COLORS[idx % ACCENT_COLORS.length],
      }));
      return [
        {
          key: "__today__",
          label: "Today's progress",
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
          priority: false,
          colorClass: "bg-primary",
        },
        ...taskRows,
      ];
    }

    return [];
  }, [recurringTasks, tasks, tasksForDay]);

  const hasAny = items.length > 0;
  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - MAX_VISIBLE;
  const modalTotalPages = Math.ceil(items.length / MODAL_PAGE_SIZE);
  const modalItems = items.slice(modalPage * MODAL_PAGE_SIZE, modalPage * MODAL_PAGE_SIZE + MODAL_PAGE_SIZE);
  const sectionTitle = recurringTasks.length > 0 ? "Active Projects" : "Today's Tasks";

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      {/* Total Study Time Card */}
      <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-xl text-primary">schedule</span>
          <span className="font-headline font-bold text-on-surface text-lg">Total Study Time</span>
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
      <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-xl text-secondary">star</span>
          <span className="font-headline font-bold text-on-surface text-lg">Priority Time Limit</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={priorityPercent}
            onChange={(e) => setPriorityPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
            className="w-20 px-3 py-2 rounded-xl border border-outline/60 bg-surface-container-highest text-on-surface font-semibold text-base focus:outline-none focus:ring-2 focus:ring-secondary/60"
          />
          <span className="text-on-surface-variant font-medium">% of total time</span>
        </div>
        <span className="text-xs text-on-surface-variant">
          Max percent of study time that can be allocated to priority tasks.
        </span>
      </section>

      {/* Daily Inspiration Card */}
      <section className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4">
          <span className="material-symbols-outlined text-3xl text-primary/60">format_quote</span>
          <p className="font-headline font-medium text-base leading-relaxed italic text-on-surface">
            "The secret of getting ahead is getting started."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-6 h-px bg-primary/40" />
            <span className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant">
              Mark Twain
            </span>
          </div>
        </div>
      </section>

      {/* Active Projects — only shown when there are tasks */}
      {hasAny && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase">
              {sectionTitle}
            </h3>
            {items.length > 1 && (
              <span className="text-[10px] text-on-surface-variant/60">{items.length} total</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {visible.map(({ key, ...item }) => (
              <ProgressRow key={key} {...item} />
            ))}
            {overflow > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-center py-1.5 text-xs text-secondary hover:text-secondary/80 font-semibold transition-colors"
              >
                +{overflow} more — view all
              </button>
            )}
          </div>
        </section>
      )}

      {/* All projects modal */}
      {showAll && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-headline font-bold text-on-surface">{sectionTitle}</h2>
              <button
                onClick={() => setShowAll(false)}
                className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {modalItems.map(({ key, ...item }) => (
                <ProgressRow key={key} {...item} />
              ))}
            </div>
            <Pagination
              page={modalPage}
              totalPages={modalTotalPages}
              onPrev={() => setModalPage((p) => p - 1)}
              onNext={() => setModalPage((p) => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default RightSidebar;
