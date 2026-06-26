import { useLang } from "../../../shared/i18n/LangContext";

const monthName = function(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
};

const RecurrenceSection = function({
  // Section 1: Date
  dateMode,
  setDateMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  // Section 2: Repeat
  recurrence,
  setRecurrence,
  monthsAhead,
  setMonthsAhead,
  yearsAhead,
  setYearsAhead,
  // Context
  isRecurringInstance,
  taskDate,
}) {
  const { t, lang } = useLang();
  const locale = lang === "bg" ? "bg-BG" : "en-US";

  const REPEAT_OPTIONS = [
    { value: "none",    label: t.noRepeat, icon: "block" },
    { value: "daily",   label: t.daily,    icon: "today" },
    { value: "weekly",  label: t.weekly,   icon: "date_range" },
    { value: "monthly", label: t.monthly,  icon: "calendar_month" },
    { value: "yearly",  label: t.yearly,   icon: "event_repeat" },
  ];

  return (
    <div className="flex flex-col gap-4 border-t border-outline-variant/30 pt-4">

      {/* Recurring-instance warning banner */}
      {isRecurringInstance && (
        <p className="text-xs text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-3 py-2 flex items-center gap-1.5 mb-1">
          <span className="material-symbols-outlined text-sm">info</span>
          {t.recurringChangeNote}
        </p>
      )}

      {/* ── SECTION 1: Date ───────────────────────────────── */}
      <div className="flex flex-col gap-3">

        {/* Header row: icon + label on left, segmented toggle on right */}
        <div className="flex items-center justify-between">
          <span
            id="date-section-label"
            className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">calendar_today</span>
            {t.dateLabel}
          </span>

          <div role="group" aria-labelledby="date-section-label">
            <button
              type="button"
              onClick={() => setDateMode("single")}
              aria-pressed={dateMode === "single"}
              className={`px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:z-10 rounded-l-xl rounded-r-none border relative ${
                dateMode === "single"
                  ? "bg-secondary text-on-secondary border-secondary z-10"
                  : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:z-10"
              }`}
            >
              {t.singleDay}
            </button>
            <button
              type="button"
              onClick={() => setDateMode("range")}
              aria-pressed={dateMode === "range"}
              className={`px-3 py-1.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:z-10 rounded-r-xl rounded-l-none border -ml-px relative ${
                dateMode === "range"
                  ? "bg-secondary text-on-secondary border-secondary z-10"
                  : "border-outline-variant/60 text-on-surface-variant hover:bg-surface-container hover:z-10"
              }`}
            >
              {t.dateRangeMode}
            </button>
          </div>
        </div>

        {/* Single date input */}
        {dateMode === "single" && (
          <label className="flex flex-col gap-1">
            <span className="sr-only">{t.dateLabel}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
            />
          </label>
        )}

        {/* Range card */}
        {dateMode === "range" && (
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40 flex flex-col gap-2">
            {/* From row */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="range-start-date"
                className="text-sm font-semibold text-on-surface-variant w-10 flex-shrink-0"
              >
                {t.fromDate}
              </label>
              <input
                id="range-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
              />
            </div>

            {/* To row */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="range-end-date"
                className="text-sm font-semibold text-on-surface-variant w-10 flex-shrink-0"
              >
                {t.toDate}
              </label>
              <input
                id="range-end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 bg-surface-container-highest border border-outline/60 rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 [color-scheme:dark]"
              />
              {endDate && (
                <button
                  type="button"
                  onClick={() => setEndDate("")}
                  aria-label={t.removeEndDate}
                  className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Warning: end date missing */}
            {!endDate && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                {t.periodEndDateRequired}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Repeat ────────────────────────────── */}
      <div className="flex flex-col gap-3 border-t border-outline-variant/30 pt-4">

        {/* Repeat header */}
        <span
          id="repeat-group-label"
          className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">repeat</span>
          {t.repeatLabel}
        </span>

        {/* Repeat pills */}
        <div
          role="group"
          aria-labelledby="repeat-group-label"
          className="flex flex-wrap gap-1.5"
        >
          {REPEAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRecurrence(opt.value)}
              aria-pressed={recurrence === opt.value}
              className={`flex flex-1 basis-0 min-w-[56px] flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all ${
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

        {/* Sub-config card */}
        {recurrence === "daily" && dateMode !== "range" && (
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40">
            <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-secondary">info</span>
              {t.repeatsEveryDayUntil(monthName(taskDate || startDate, locale))}
            </p>
          </div>
        )}

        {recurrence === "monthly" && (
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40">
            <div className="flex items-center gap-3">
              <label
                htmlFor="recurrence-months"
                className="text-sm font-semibold text-on-surface-variant whitespace-nowrap"
              >
                {t.repeatForNext}
              </label>
              <input
                id="recurrence-months"
                type="number"
                min="1"
                max="24"
                value={monthsAhead}
                onChange={(e) => setMonthsAhead(e.target.value)}
                className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
              <span className="text-sm font-semibold text-on-surface-variant">{t.months}</span>
            </div>
          </div>
        )}

        {recurrence === "yearly" && (
          <div className="bg-surface-container-low rounded-xl p-3 border border-outline-variant/40">
            <div className="flex items-center gap-3">
              <label
                htmlFor="recurrence-years"
                className="text-sm font-semibold text-on-surface-variant whitespace-nowrap"
              >
                {t.repeatForNext}
              </label>
              <input
                id="recurrence-years"
                type="number"
                min="1"
                max="10"
                value={yearsAhead}
                onChange={(e) => setYearsAhead(e.target.value)}
                className="w-16 bg-surface-container-highest border border-outline/60 rounded-lg px-2 py-1.5 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-secondary/50"
              />
              <span className="text-sm font-semibold text-on-surface-variant">{t.years}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default RecurrenceSection;
