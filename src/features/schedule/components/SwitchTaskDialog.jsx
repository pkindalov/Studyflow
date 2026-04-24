export default function SwitchTaskDialog({ fromTask, toTask, onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">swap_horiz</span>
            {t.switchTaskTitle}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5 bg-surface-container-high rounded-xl px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">{t.switchTaskFrom}</span>
              <span className="text-sm font-semibold text-on-surface line-clamp-1">{fromTask.text}</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/40">arrow_downward</span>
            </div>
            <div className="flex flex-col gap-0.5 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">{t.switchTaskTo}</span>
              <span className="text-sm font-semibold text-on-surface line-clamp-1">{toTask.text}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all">{t.switchBtn}</button>
        </div>
      </div>
    </div>
  );
}
