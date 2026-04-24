export default function QuickTimerPrompt({ task, minutes, onChangeMinutes, onConfirm, onCancel, t }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-xs p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="font-headline font-bold text-on-surface text-base leading-tight line-clamp-2">{task.text}</h3>
          <p className="text-xs text-on-surface-variant">{t.howManyMinutes}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number" min="1" max="480" value={minutes}
            onChange={(e) => onChangeMinutes(Math.max(1, Math.min(480, Number(e.target.value))))}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm();
              else if (e.key === "Escape") onCancel();
            }}
            autoFocus
            className="flex-1 bg-surface-container-highest border border-outline/60 rounded-xl px-3 py-2 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="text-sm text-on-surface-variant">{t.minUnit}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:opacity-90 transition-all">{t.startTimerBtn}</button>
        </div>
      </div>
    </div>
  );
}
