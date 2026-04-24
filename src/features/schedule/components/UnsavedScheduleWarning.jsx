export default function UnsavedScheduleWarning({ onCancel, onDiscard, onSaveAndContinue, t }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-warning, #f59e0b)" }}>warning</span>
            {t.unsavedScheduleTitle}
          </h3>
          <p className="text-sm text-on-surface-variant">{t.unsavedScheduleMsg}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
          <button onClick={onDiscard} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-all">{t.discardAndContinue}</button>
          <button onClick={onSaveAndContinue} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all">{t.saveAndContinue}</button>
        </div>
      </div>
    </div>
  );
}
