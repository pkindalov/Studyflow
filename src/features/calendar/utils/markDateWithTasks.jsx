import { appliesToDate } from "../../tasks/hooks/useRecurringTasks";

export const markDateWithTasks = (tasks, formatDateKey, recurringTasks = []) => (props) => {
  const { date, view } = props;
  const key = formatDateKey(date);
  const hasManual = (tasks[key]?.length ?? 0) > 0;
  const hasRecurring = recurringTasks.some((t) => appliesToDate(t, key));
  return view === "month" && (hasManual || hasRecurring) ? (
    <div className="flex justify-center mt-1">
      <div className="w-1.5 h-1.5 rounded-full bg-white/70"></div>
    </div>
  ) : null;
};
