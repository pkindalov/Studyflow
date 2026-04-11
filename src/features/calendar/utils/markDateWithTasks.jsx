import { appliesToDate } from "../../tasks/hooks/useRecurringTasks";

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const markDateWithTasks = (
  tasks,
  formatDateKey,
  recurringTasks = [],
  showCompletion = false,
) => (props) => {
  const { date, view } = props;
  if (view !== "month") return null;

  const key = formatDateKey(date);
  const dayTasks = tasks[key] || [];
  const hasManual = dayTasks.length > 0;
  const hasRecurring = recurringTasks.some((t) => appliesToDate(t, key));

  if (!hasManual && !hasRecurring) return null;

  // Show completion indicators on past/today dates that have manual task records
  if (showCompletion && hasManual && date <= today()) {
    const allDone = dayTasks.every((t) => t.done);
    return (
      <div className="flex justify-center mt-0.5">
        {allDone ? (
          <span className="text-[10px] font-bold leading-none text-secondary">✓</span>
        ) : (
          <span className="text-[10px] font-bold leading-none text-error">✗</span>
        )}
      </div>
    );
  }

  // Default: small dot
  return (
    <div className="flex justify-center mt-1">
      <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
    </div>
  );
};
