import { useLang } from "../../../shared/i18n/LangContext";

function SummaryCard({ total, completed, remaining, progress }) {
  const { t } = useLang();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <section className="bg-surface-container rounded-2xl p-5 sm:p-8 border border-outline-variant/50 shadow-[0_4px_24px_rgba(0,0,0,0.3)] relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
      <div className="flex items-center justify-between relative z-10 gap-4">
        <div className="flex flex-col gap-4 sm:gap-6 min-w-0">
          <div>
            <h3 className="text-lg sm:text-headline-sm font-headline font-semibold text-on-surface mb-0.5">
              {t.focusProgressLabel}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {t.greatProgressMsg}
            </p>
          </div>
          <div className="flex gap-4 sm:gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                {t.totalLabel}
              </span>
              <span className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
                {total}
              </span>
            </div>
            <div className="flex flex-col border-l border-outline-variant/20 pl-4 sm:pl-10">
              <span className="text-[9px] sm:text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                {t.doneLabel}
              </span>
              <span className="text-2xl sm:text-3xl font-headline font-bold text-secondary">
                {completed.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col border-l border-outline-variant/20 pl-4 sm:pl-10">
              <span className="text-[9px] sm:text-label-md text-on-surface-variant font-bold tracking-widest uppercase">
                {t.leftLabel}
              </span>
              <span className="text-2xl sm:text-3xl font-headline font-bold text-primary">
                {remaining.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
        {/* Circular Progress — scales between 80px (mobile) and 128px (desktop) */}
        <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 128 128"
          >
            <circle
              className="text-surface-container-highest"
              cx="64"
              cy="64"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              className="text-primary"
              cx="64"
              cy="64"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base sm:text-2xl font-headline font-bold text-on-surface">
              {progress}%
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">
              {t.doneLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SummaryCard;
