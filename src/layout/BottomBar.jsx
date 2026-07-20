export default function BottomBar({ onExport, onImport, onShowClearConfirm, isCustomLayout, onResetLayout, t }) {
  return (
    <>
      {/* Mobile-only bottom toolbar */}
      <div className="flex lg:hidden flex-col gap-2 mt-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.exportTitle}>
            <span className="material-symbols-outlined text-sm">backup</span>
            {t.exportBtn}
          </button>
          <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.importTitle}>
            <span className="material-symbols-outlined text-sm">restore</span>
            {t.importBtn}
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap border-t border-outline-variant/30 pt-2">
          <button onClick={onShowClearConfirm} className="flex items-center gap-1.5 px-3 py-2 btn-clear-ghost border text-error rounded-xl text-xs font-semibold shadow-sm transition-all" title={t.clearTitle}>
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            {t.clearBtn}
          </button>
          {isCustomLayout && (
            <button onClick={onResetLayout} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all">
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              {t.resetLayoutBtn}
            </button>
          )}
        </div>
      </div>

      {/* Desktop toolbar: static (not fixed), so it can never float on top of sidebar/main content. */}
      <div className="hidden lg:flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/30">
        <div className="flex items-center gap-2">
          <button onClick={onExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.exportTitle}>
            <span className="material-symbols-outlined text-sm">backup</span>
            {t.exportBtn}
          </button>
          <button onClick={onImport} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.importTitle}>
            <span className="material-symbols-outlined text-sm">restore</span>
            {t.importBtn}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onShowClearConfirm} className="flex items-center gap-1.5 px-4 py-2.5 btn-clear-ghost border text-error rounded-xl text-xs font-semibold shadow-sm transition-all" title={t.clearTitle}>
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            {t.clearBtn}
          </button>
          <div className="w-px h-5 bg-outline-variant/40 mx-1" aria-hidden="true" />
          <button
            onClick={onResetLayout}
            disabled={!isCustomLayout}
            className={`flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold shadow-sm transition-all ${isCustomLayout ? "hover:bg-surface-container-high" : "opacity-40 cursor-not-allowed"}`}
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t.resetLayoutBtn}
          </button>
        </div>
      </div>
    </>
  );
}
