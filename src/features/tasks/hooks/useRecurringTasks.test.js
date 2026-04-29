import { describe, it, expect } from 'vitest'
import { appliesToDate, recurrenceLabel } from './useRecurringTasks'

const tmpl = (overrides) => ({
  startDate: '2024-01-01',
  endDate: '',
  recurrence: 'daily',
  ...overrides,
})

// ── appliesToDate ────────────────────────────────────────────────────────────

describe('appliesToDate', () => {
  it('returns false when dateKey is before startDate', () => {
    expect(appliesToDate(tmpl({ startDate: '2024-06-01' }), '2024-05-31')).toBe(false)
  })

  it('returns false when dateKey is after endDate', () => {
    expect(appliesToDate(tmpl({ endDate: '2024-06-01' }), '2024-06-02')).toBe(false)
  })

  it('returns true on the startDate itself', () => {
    expect(appliesToDate(tmpl({ startDate: '2024-06-01' }), '2024-06-01')).toBe(true)
  })

  describe('daily', () => {
    it('returns true for any date in range', () => {
      expect(appliesToDate(tmpl({ recurrence: 'daily' }), '2024-09-15')).toBe(true)
    })
  })

  describe('weekly', () => {
    // 2024-01-01 is a Monday (getDay() === 1)
    it('returns true on the same weekday', () => {
      expect(appliesToDate(tmpl({ recurrence: 'weekly', startDate: '2024-01-01' }), '2024-01-08')).toBe(true)
    })

    it('returns false on a different weekday', () => {
      expect(appliesToDate(tmpl({ recurrence: 'weekly', startDate: '2024-01-01' }), '2024-01-09')).toBe(false)
    })
  })

  describe('monthly', () => {
    it('returns true on the same day of month', () => {
      expect(appliesToDate(tmpl({ recurrence: 'monthly', startDate: '2024-01-15' }), '2024-03-15')).toBe(true)
    })

    it('returns false on a different day of month', () => {
      expect(appliesToDate(tmpl({ recurrence: 'monthly', startDate: '2024-01-15' }), '2024-03-16')).toBe(false)
    })
  })

  describe('yearly', () => {
    it('returns true on the same month+day in a later year', () => {
      expect(appliesToDate(tmpl({ recurrence: 'yearly', startDate: '2024-03-15' }), '2025-03-15')).toBe(true)
    })

    it('returns false on a different date', () => {
      expect(appliesToDate(tmpl({ recurrence: 'yearly', startDate: '2024-03-15' }), '2025-03-16')).toBe(false)
    })
  })

  it('returns false for unknown recurrence type', () => {
    expect(appliesToDate(tmpl({ recurrence: 'biweekly' }), '2024-03-15')).toBe(false)
  })
})

// ── recurrenceLabel ──────────────────────────────────────────────────────────

describe('recurrenceLabel', () => {
  it('daily returns "Every day"', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'daily' }))).toBe('Every day')
  })

  it('weekly returns the day name', () => {
    // 2024-01-01 is Monday
    expect(recurrenceLabel(tmpl({ recurrence: 'weekly', startDate: '2024-01-01' }))).toBe('Every Monday')
  })

  it('monthly returns ordinal day — 1st', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'monthly', startDate: '2024-01-01' }))).toBe('Monthly on the 1st')
  })

  it('monthly returns ordinal day — 2nd', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'monthly', startDate: '2024-01-02' }))).toBe('Monthly on the 2nd')
  })

  it('monthly returns ordinal day — 3rd', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'monthly', startDate: '2024-01-03' }))).toBe('Monthly on the 3rd')
  })

  it('monthly returns ordinal day — 11th (th override)', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'monthly', startDate: '2024-01-11' }))).toBe('Monthly on the 11th')
  })

  it('yearly includes month and day', () => {
    expect(recurrenceLabel(tmpl({ recurrence: 'yearly', startDate: '2024-03-15' }))).toBe('Yearly on March 15')
  })

  it('appends end date when present', () => {
    expect(
      recurrenceLabel(tmpl({ recurrence: 'daily', startDate: '2024-01-01', endDate: '2024-12-31' }))
    ).toBe('Every day · ends 2024-12-31')
  })
})
