/**
 * Pure allocation math — no side-effects, easily unit-testable.
 * Returns a shuffled, time-allocated schedule array, or null if nothing to schedule.
 */
export function generateSchedule({ tasksForDay, excludedTaskIds, totalStudyTime, priorityPercent }) {
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

  const allocate = (tasks, budget) => {
    if (tasks.length === 1) return [{ ...tasks[0], scheduledMinutes: budget }];
    const perTask = Math.floor(budget / tasks.length);
    let left = budget;
    return tasks.map((task, i) => {
      const time = i === tasks.length - 1 ? left : perTask;
      left -= time;
      return { ...task, scheduledMinutes: time };
    });
  };

  const scheduleArr = [
    ...allocate(priorityTasks, priorityMinutes),
    ...allocate(nonPriorityTasks, nonPriorityMinutes),
  ].filter((t) => t.scheduledMinutes > 0);

  const prioritySlice = scheduleArr.filter((t) => t.priority).sort(() => Math.random() - 0.5);
  const normalSlice = scheduleArr.filter((t) => !t.priority).sort(() => Math.random() - 0.5);

  return [...prioritySlice, ...normalSlice];
}
