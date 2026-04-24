export default function ImportConfirmDialog({ exportedAt, lang, onCancel, onConfirm, t }) {
  const formattedDate = exportedAt
    ? new Date(exportedAt).toLocaleDateString(lang === "bg" ? "bg-BG" : "en-US", { dateStyle: "medium" })
    : t.unknownDate;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h3 className="font-headline font-bold text-on-surface text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">restore</span>
            {t.restoreBackupTitle}
          </h3>
          <p className="text-sm text-on-surface-variant">{t.restoreConfirmFn(formattedDate)}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl border border-outline-variant/60 bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high transition-all text-sm">{t.cancel}</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold hover:opacity-90 transition-all text-sm">{t.restore}</button>
        </div>
      </div>
    </div>
  );
}
