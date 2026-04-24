export default function ClearAllConfirm({ onCancel, onConfirm, t }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-xl">warning</span>
            {t.clearAllDataTitle}
          </h3>
          <p className="text-sm text-on-surface-variant">{t.clearWarningMsg}</p>
          <ul className="text-sm text-on-surface-variant flex flex-col gap-1 pl-2">
            {[t.clearItem1, t.clearItem2, t.clearItem3, t.clearItem4].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-error/60 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-error/80 bg-error/8 border border-error/20 rounded-xl px-3 py-2 mt-1">{t.cannotUndo}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/50 hover:bg-surface-container-high transition-all">{t.cancel}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-error text-white hover:opacity-90 transition-all">{t.clearConfirmBtn}</button>
        </div>
      </div>
    </div>
  );
}
