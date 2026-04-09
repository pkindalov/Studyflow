import { useState, useEffect } from "react";
import TaskCard from "./TaskCard";
import Pagination from "./Pagination";

const PAGE_SIZE = 8;

function TaskList({ tasks, isGridView, onToggle, onDelete, onEdit, onStopRecurring }) {
  const [page, setPage] = useState(0);

  // Reset to first page whenever the task list changes (date switch, add/delete)
  useEffect(() => { setPage(0); }, [tasks.length]);

  const totalPages = Math.ceil(tasks.length / PAGE_SIZE);
  const paginated = tasks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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
        <>
          <div
            className={
              isGridView
                ? "grid grid-cols-2 md:grid-cols-3 gap-4"
                : "flex flex-col gap-6"
            }
          >
            {paginated.map((task) => (
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
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
}

export default TaskList;
