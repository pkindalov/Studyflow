export const markDateWithTasks = (tasks, formatDateKey) => (props) => {
  const { date, view } = props;
  const key = formatDateKey(date);
  return view === "month" && tasks[key]?.length > 0 ? (
    <div className="flex justify-center mt-1">
      <div className="w-1.5 h-1.5 rounded-full bg-gray-900"></div>
    </div>
  ) : null;
};
