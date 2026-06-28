import { useState, useMemo, useEffect, useRef, useId } from "react";
import Pagination from "../../../shared/components/Pagination";
import { useLang } from "../../../shared/i18n/LangContext";
import { getDailyQuote } from "../utils/getDailyQuote";

const MODAL_PAGE_SIZE = 5;
const MAX_VISIBLE = 5;

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

const TasksProgressModal = function({ sectionTitle, items, onClose }) {
  const { t } = useLang();
  const [modalPage, setModalPage] = useState(0);
  const modalTotalPages = Math.ceil(items.length / MODAL_PAGE_SIZE);
  const modalItems = items.slice(modalPage * MODAL_PAGE_SIZE, modalPage * MODAL_PAGE_SIZE + MODAL_PAGE_SIZE);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 max-h-[80dvh] overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-headline font-bold text-on-surface">{sectionTitle}</h2>
          <button onClick={onClose} aria-label={t.close} className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-all">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {modalItems.map(({ key, ...item }) => <ProgressRow key={key} {...item} />)}
        </div>
        <Pagination page={modalPage} totalPages={modalTotalPages} onPrev={() => setModalPage((p) => p - 1)} onNext={() => setModalPage((p) => p + 1)} />
      </div>
    </div>
  );
};

const ACCENT_COLORS = [
  "bg-primary",
  "bg-secondary",
  "bg-tertiary",
  "bg-primary/60",
  "bg-secondary/60",
];

export function ScheduleSettingsSection({ totalStudyTime, setTotalStudyTime, priorityPercent, setPriorityPercent, tasksCount = 0 }) {
  const { t } = useLang();
  const [showHint, setShowHint] = useState(false);
  const hintRef = useRef(null);
  const isDisabled = tasksCount === 0;
  const instanceId = useId();

  useEffect(() => {
    if (!showHint) return;
    const handleKey = (e) => { if (e.key === "Escape") setShowHint(false); };
    const handleClick = (e) => { if (!hintRef.current?.contains(e.target)) setShowHint(false); };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [showHint]);

  return (
    <section className={`bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/50 flex flex-col gap-4 transition-opacity ${isDisabled ? "opacity-50" : ""}`}
      title={isDisabled ? t.summaryHintNoTasks : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase flex-1">{t.scheduleSettings}</span>
        <div ref={hintRef} className="relative">
          <button
            type="button"
            onClick={() => setShowHint((isVisible) => !isVisible)}
            className="w-5 h-5 flex items-center justify-center rounded-full text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
            aria-label={t.scheduleSettingsHint}
            aria-expanded={showHint}
            disabled={isDisabled}
          >
            <span className="material-symbols-outlined text-sm">help_outline</span>
          </button>
          {showHint && (
            <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-surface-container-highest border border-outline-variant/50 rounded-xl shadow-xl p-3 text-xs text-on-surface-variant leading-relaxed">
              {t.scheduleSettingsHint}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${instanceId}-study-time`} className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">schedule</span>
            {t.totalStudyTime}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id={`${instanceId}-study-time`}
              type="number"
              min={1}
              max={24}
              step={0.25}
              value={totalStudyTime}
              onChange={(e) => setTotalStudyTime(Math.max(1, Math.min(24, Number(e.target.value))))}
              disabled={isDisabled}
              className="w-16 px-2 py-1.5 rounded-xl border border-outline/60 bg-surface-container-highest text-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
            <span className="text-xs text-on-surface-variant">{t.hoursUnit}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${instanceId}-priority-pct`} className="text-xs font-semibold text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-secondary">star</span>
            {t.priorityTimeLimit}
          </label>
          <div className="flex items-center gap-1.5">
            <input
              id={`${instanceId}-priority-pct`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={priorityPercent}
              onChange={(e) => setPriorityPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
              disabled={isDisabled}
              className="w-16 px-2 py-1.5 rounded-xl border border-outline/60 bg-surface-container-highest text-on-surface font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-secondary/60"
            />
            <span className="text-xs text-on-surface-variant">%</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUOTES_EN = [
  { text: "\"The secret of getting ahead is getting started.\"", author: "Mark Twain" },
  { text: "\"An investment in knowledge pays the best interest.\"", author: "Benjamin Franklin" },
  { text: "\"The more that you read, the more things you will know.\"", author: "Dr. Seuss" },
  { text: "\"Education is the passport to the future.\"", author: "Malcolm X" },
  { text: "\"Live as if you were to die tomorrow. Learn as if you were to live forever.\"", author: "Mahatma Gandhi" },
  { text: "\"The beautiful thing about learning is nobody can take it away from you.\"", author: "B.B. King" },
  { text: "\"You don't have to be great to start, but you have to start to be great.\"", author: "Zig Ziglar" },
  { text: "\"Study hard what interests you the most in the most undisciplined manner possible.\"", author: "Richard Feynman" },
];

const QUOTES_BG = [
  { text: "\"Тайната на напредъка е да започнеш.\"", author: "Марк Твен" },
  { text: "\"Инвестицията в знание носи най-добра лихва.\"", author: "Бенджамин Франклин" },
  { text: "\"Колкото повече четеш, толкова повече ще знаеш.\"", author: "Д-р Сюс" },
  { text: "\"Образованието е паспортът за бъдещето.\"", author: "Малкълм X" },
  { text: "\"Живей като ще умреш утре. Учи като ще живееш вечно.\"", author: "Махатма Ганди" },
  { text: "\"Хубавото на ученето е, че никой не може да ти го вземе.\"", author: "Б.Б. Кинг" },
  { text: "\"Не трябва да си велик, за да започнеш, но трябва да започнеш, за да станеш велик.\"", author: "Зиг Зиглар" },
  { text: "\"Учи усилено това, което те интересува най-много.\"", author: "Ричард Файнман" },
];


export function QuoteSection() {
  const { lang } = useLang();
  const quote = getDailyQuote(lang === "bg" ? QUOTES_BG : QUOTES_EN);
  return (
    <section className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-4">
        <span className="material-symbols-outlined text-3xl text-primary/60">format_quote</span>
        <p className="font-headline font-medium text-base leading-relaxed italic text-on-surface">
          {quote.text}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-6 h-px bg-primary/40" />
          <span className="text-xs uppercase tracking-widest font-semibold text-on-surface-variant">
            {quote.author}
          </span>
        </div>
      </div>
    </section>
  );
}

export function TasksProgressSection({
  tasks,
  recurringTasks,
  tasksForDay,
  scheduleTimers = {},
  taskAllocations = {},
}) {
  const { t } = useLang();
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (recurringTasks.length > 0) {
      return recurringTasks.map((tpl, idx) => {
        const instances = Object.values(tasks).flat().filter((task) => task.recurringId === tpl.id);
        const done = instances.filter((task) => task.done).length;
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
      const taskRows = tasksForDay.map((task, idx) => {
        let progress = 0;
        if (task.done) {
          progress = 100;
        } else {
          const elapsed = scheduleTimers[task.id] || 0;
          const totalSec = (taskAllocations[task.id] || 0) * 60;
          if (totalSec > 0) progress = Math.min(100, Math.round((elapsed / totalSec) * 100));
        }
        return {
          key: task.id,
          label: task.text,
          progress,
          priority: task.priority,
          colorClass: ACCENT_COLORS[idx % ACCENT_COLORS.length],
        };
      });

      const overallProgress = taskRows.length > 0
        ? Math.round(taskRows.reduce((sum, r) => sum + r.progress, 0) / taskRows.length)
        : 0;

      return [
        { key: "__today__", label: t.todaysTasks, progress: overallProgress, priority: false, colorClass: "bg-primary" },
        ...taskRows,
      ];
    }

    return [];
  }, [recurringTasks, tasks, tasksForDay, scheduleTimers, taskAllocations, t]);

  const hasAny = items.length > 0;
  const visible = items.slice(0, MAX_VISIBLE);
  const overflow = items.length - MAX_VISIBLE;
  const sectionTitle = recurringTasks.length > 0 ? t.activeProjects : t.todaysTasks;

  if (!hasAny) return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase px-1">
        {t.todaysTasks}
      </h3>
      <p className="text-xs text-on-surface-variant/50 px-1">{t.noTasksMessage}</p>
    </section>
  );

  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold tracking-[0.12em] text-on-surface-variant uppercase">
            {sectionTitle}
          </h3>
          {items.length > 1 && (
            <span className="text-[10px] text-on-surface-variant/60">{t.nTotal(items.length)}</span>
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
              {t.moreViewAll(overflow)}
            </button>
          )}
        </div>
      </section>

      {showAll && (
        <TasksProgressModal sectionTitle={sectionTitle} items={items} onClose={() => setShowAll(false)} />
      )}
    </>
  );
}
