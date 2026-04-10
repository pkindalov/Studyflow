function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
      <button
        onClick={onPrev}
        disabled={page === 0}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
        Prev
      </button>
      <span className="text-xs text-on-surface-variant tabular-nums">
        {page + 1} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages - 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30 disabled:pointer-events-none transition-all"
      >
        Next
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}

export default Pagination;
