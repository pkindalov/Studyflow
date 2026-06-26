import { useLang } from "../../../shared/i18n/LangContext";

const monthName = function(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
};

const RecurrenceSection = function({
  recurrence,
  setRecurrence,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  monthsAhead,
  setMonthsAhead,
  yearsAhead,
  setYearsAhead,
  isRecurringInstance,
}) {
  const { t, lang } = useLang();
  const locale = lang === "bg" ? "bg-BG" : "en-US";
  const hasRepeat = recurrence && recurrence !== "none";

  const RECURRENCE_OPTIONS = [
    { value: "none",    label: t.noRepeat,  icon: "block" },
    { value: "daily",   label: t.daily,     icon: "today" },
    { value: "monthly", label: t.monthly,   icon: "calendar_month" },
    { value: "yearly",  label: t.yearly,    icon: "event_repeat" },
    { value: "custom",  label: t.custom,    icon: "date_range" },
  ];

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">
      {isRecurringInstance && (
        <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">info</span>
          {t.recurringChangeNote}
        </p>
      )}

      <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
        <span className="material-symbols-outlined text-base">repeat</span>
        {t.repeatLabel}
      </span>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {RECURRENCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRecurrence(opt.value)}
            className={`flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-sm font-semibold border transition-all ${
              recurrence === opt.value
                ? "bg-secondary text-on-secondary border-secondary"
                : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-base">{opt.icon}</span>
            <span className="leading-tight text-center">{opt.label}</span>
          </button>
        ))}
      </div>

      {hasRepeat && (
        <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40 flex flex-col gap-2">
          {recurrence === "daily" && (
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">info</span>
              {t.repeatsEveryDayUntil(monthName(startDate, locale))}
            </p>
          )}

          {recurrence === "monthly" && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">{t.repeatForNext}</label>
              <input type="number" min="1" max="24" value={monthsAhead} onChange={(e) => setMonthsAhead(e.target.value)} className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50" />
              <span className="text-xs font-semibold text-on-surface-variant">{t.months}</span>
            </div>
          )}

          {recurrence === "yearly" && (
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">{t.repeatForNext}</label>
              <input type="number" min="1" max="10" value={yearsAhead} onChange={(e) => setYearsAhead(e.target.value)} className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50" />
              <span className="text-xs font-semibold text-on-surface-variant">{t.years}</span>
            </div>
          )}

          {recurrence === "custom" && (
            <>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-on-surface-variant w-10 flex-shrink-0">{t.fromDate}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-on-surface-variant w-10 flex-shrink-0">{t.toDate}</label>
                <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]" />
                {endDate && (
                  <button type="button" onClick={() => setEndDate("")} className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0" title={t.removeEndDate}>
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </div>
              {!endDate && (
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {t.repeatsDailyNoEnd}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurrenceSection;
