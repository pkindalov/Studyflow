import TaskCard from "./TaskCard";

function TaskList({ tasks, isGridView, onToggle, onDelete, onEdit, onStopRecurring }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm font-headline font-semibold text-on-surface">
          Priority Tasks
        </h2>
        <button className="text-sm font-semibold text-primary hover:underline transition-all">
          View All Archives
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-on-surface-variant text-sm text-center mt-10">
          No tasks for this day.
        </p>
      ) : (
        <div
          className={
            isGridView
              ? "grid grid-cols-2 md:grid-cols-3 gap-4"
              : "flex flex-col gap-6"
          }
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onStopRecurring={onStopRecurring}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default TaskList;
