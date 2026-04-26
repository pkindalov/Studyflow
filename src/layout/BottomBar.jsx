export default function BottomBar({ onExport, onImport, onShowClearConfirm, isCustomLayout, onResetLayout, t }) {
  return (
    <>
      {/* Mobile-only bottom toolbar */}
      <div className="flex lg:hidden items-center justify-between gap-2 mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={onExport} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.exportTitle}>
            <span className="material-symbols-outlined text-sm">backup</span>
            {t.exportBtn}
          </button>
          <button onClick={onImport} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all" title={t.importTitle}>
            <span className="material-symbols-outlined text-sm">restore</span>
            {t.importBtn}
          </button>
          <button onClick={onShowClearConfirm} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-sm transition-all" title={t.clearTitle}>
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            {t.clearBtn}
          </button>
        </div>
        {isCustomLayout && (
          <button onClick={onResetLayout} className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-sm transition-all">
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            {t.resetLayoutBtn}
          </button>
        )}
      </div>

      {/* Desktop bottom-left actions */}
      <div className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2">
        <button onClick={onExport} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.exportTitle}>
          <span className="material-symbols-outlined text-sm">backup</span>
          {t.exportBtn}
        </button>
        <button onClick={onImport} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:bg-surface-container-high shadow-lg transition-all" title={t.importTitle}>
          <span className="material-symbols-outlined text-sm">restore</span>
          {t.importBtn}
        </button>
        <button onClick={onShowClearConfirm} className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold hover:border-error/40 hover:text-error hover:bg-error/5 shadow-lg transition-all" title={t.clearTitle}>
          <span className="material-symbols-outlined text-sm">delete_sweep</span>
          {t.clearBtn}
        </button>
      </div>

      {/* Desktop bottom-right reset layout */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40">
        <button
          onClick={onResetLayout}
          disabled={!isCustomLayout}
          className={`flex items-center gap-1.5 px-4 py-2.5 bg-surface-container border border-outline-variant/50 text-on-surface-variant rounded-xl text-xs font-semibold shadow-lg transition-all ${isCustomLayout ? "hover:bg-surface-container-high" : "opacity-40 cursor-not-allowed"}`}
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          {t.resetLayoutBtn}
        </button>
      </div>
    </>
  );
}
