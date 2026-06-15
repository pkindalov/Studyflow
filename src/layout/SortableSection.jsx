import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableSection({ id, t, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    // transform and transition must be inline — dnd-kit drives these values dynamically
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group/sec ${isDragging ? "opacity-30" : "opacity-100"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex justify-center mb-1 opacity-0 group-hover/sec:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
        title={t.dragToMoveHint}
      >
        <span className="material-symbols-outlined text-base text-on-surface-variant/50 hover:text-on-surface-variant transition-colors">drag_indicator</span>
      </div>
      {children}
    </div>
  );
}
