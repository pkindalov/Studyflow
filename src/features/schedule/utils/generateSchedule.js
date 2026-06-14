const fisherYatesShuffle = function(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const generateSchedule = function({ tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent }) {
  const selectedTasks = tasksForDay.filter((task) => !excludedTaskIds.has(task.id) && !task.done);
  if (totalStudyTime <= 0 || !selectedTasks.length) return null;

  const priorityTasks = selectedTasks.filter((t) => t.priority);
  const nonPriorityTasks = selectedTasks.filter((t) => !t.priority);
  const totalMinutes = Math.max(1, Math.round(totalStudyTime * 60));

  let priorityMinutes = priorityTasks.length && priorityPercent > 0
    ? Math.round((Math.min(priorityPercent, 100) / 100) * totalMinutes)
    : 0;
  let nonPriorityMinutes = totalMinutes - priorityMinutes;

  if (priorityTasks.length === 0) {
    nonPriorityMinutes = totalMinutes;
    priorityMinutes = 0;
  } else if (priorityTasks.length === selectedTasks.length) {
    priorityMinutes = totalMinutes;
    nonPriorityMinutes = 0;
  }

  // Spreads remainder evenly: first `remainder` tasks get perTask+1, the rest get perTask.
  // This avoids the "last-task-gets-all" skew when budget < tasks.length.
  const allocate = function(tasks, budget) {
    if (!tasks.length) return [];
    const perTask = Math.floor(budget / tasks.length);
    const remainder = budget % tasks.length;
    return tasks.map((task, i) => ({ ...task, scheduledMinutes: perTask + (i < remainder ? 1 : 0) }));
  };

  const scheduleArr = [
    ...allocate(priorityTasks, priorityMinutes),
    ...allocate(nonPriorityTasks, nonPriorityMinutes),
  ].filter((t) => t.scheduledMinutes > 0);

  const prioritySlice = fisherYatesShuffle(scheduleArr.filter((t) => t.priority));
  const normalSlice = fisherYatesShuffle(scheduleArr.filter((t) => !t.priority));

  return [...prioritySlice, ...normalSlice];
}
