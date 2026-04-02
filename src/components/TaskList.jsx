import TaskCard from "./TaskCard";

function TaskList({ tasks, isGridView, onToggle, onDelete, onEdit }) {
  if (!tasks.length) {
    return (
      <p className="text-gray-400 text-sm text-center mt-10">
        No tasks for this day.
      </p>
    );
  }

  return (
    <ul
      className={
        isGridView ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "space-y-3"
      }
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}

export default TaskList;
