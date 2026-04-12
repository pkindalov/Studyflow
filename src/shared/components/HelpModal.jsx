import { useLang } from "../i18n/LangContext";

function Section({ icon, title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-base text-primary">{icon}</span>
        <h3 className="font-headline font-bold text-on-surface text-sm">{title}</h3>
      </div>
      <div className="pl-6 flex flex-col gap-1.5 text-xs text-on-surface-variant leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Tip({ children }) {
  return (
    <p className="flex gap-2">
      <span className="text-primary/60 flex-shrink-0">›</span>
      <span>{children}</span>
    </p>
  );
}

function HelpModal({ onClose }) {
  const { t } = useLang();
  const b = (text) => <strong className="text-on-surface">{text}</strong>;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="relative bg-surface-container border border-outline-variant/60 shadow-[0_24px_80px_rgba(0,0,0,0.5)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg flex flex-col max-h-[92dvh]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-primary">help</span>
            <h2 className="font-headline font-bold text-on-surface text-lg">{t.howStudyflowWorks}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all"
            aria-label={t.close}
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain px-6 py-5 flex flex-col gap-6">

          <Section icon="task_alt" title={t.helpCreatingTasks}>
            <Tip>{t.helpCreatingTip1(b)}</Tip>
            <Tip>{t.helpCreatingTip2(b)}</Tip>
            <Tip>{t.helpCreatingTip3(b)}</Tip>
            <Tip>{t.helpCreatingTip4(b)}</Tip>
          </Section>

          <Section icon="repeat" title={t.helpRecurring}>
            <Tip>{t.helpRecurringTip1(b)}</Tip>
            <Tip>{t.helpRecurringTip2(b)}</Tip>
            <Tip>{t.helpRecurringTip3(b)}</Tip>
          </Section>

          <Section icon="schedule" title={t.helpSchedule}>
            <Tip>{t.helpScheduleTip1(b)}</Tip>
            <Tip>{t.helpScheduleTip2(b)}</Tip>
            <Tip>{t.helpScheduleTip3(b)}</Tip>
            <Tip>{t.helpScheduleTip4(b)}</Tip>
          </Section>

          <Section icon="timer" title={t.helpTimer}>
            <Tip>{t.helpTimerTip1(b)}</Tip>
            <Tip>{t.helpTimerTip2(b)}</Tip>
            <Tip>{t.helpTimerTip3(b)}</Tip>
            <Tip>{t.helpTimerTip4(b)}</Tip>
          </Section>

          <Section icon="self_improvement" title={t.helpPomodoro}>
            <Tip>{t.helpPomodoroTip1(b)}</Tip>
            <Tip>{t.helpPomodoroTip2(b)}</Tip>
          </Section>

          <Section icon="headphones" title={t.helpMusic}>
            <Tip>{t.helpMusicTip1(b)}</Tip>
            <Tip>{t.helpMusicTip2(b)}</Tip>
            <Tip>{t.helpMusicTip3(b)}</Tip>
          </Section>

          <Section icon="drag_indicator" title={t.helpDragDrop}>
            <Tip>{t.helpDragDropTip1(b)}</Tip>
            <Tip>{t.helpDragDropTip2(b)}</Tip>
            <Tip>{t.helpDragDropTip3(b)}</Tip>
            <Tip>{t.helpDragDropTip4(b)}</Tip>
          </Section>

          <Section icon="storage" title={t.helpData}>
            <Tip>{t.helpDataTip1(b)}</Tip>
            <Tip>{t.helpDataTip2(b)}</Tip>
            <Tip>{t.helpDataTip3(b)}</Tip>
            <Tip>{t.helpDataTip4(b)}</Tip>
          </Section>

          <Section icon="light_mode" title={t.helpTheme}>
            <Tip>{t.helpThemeTip1(b)}</Tip>
          </Section>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between gap-4">
          <p className="text-[10px] text-on-surface-variant/60">
            {t.dataNote}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-all flex-shrink-0"
          >
            {t.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
