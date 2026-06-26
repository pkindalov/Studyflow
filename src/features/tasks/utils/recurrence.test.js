import { describe, it, expect } from 'vitest'
import { computeRecurringEndDate } from './recurrence'

describe('computeRecurringEndDate', () => {
  describe('daily', () => {
    it('returns the last day of the start month', () => {
      expect(computeRecurringEndDate('daily', '2024-01-15')).toBe('2024-01-31')
    })

    it('handles February in a leap year', () => {
      expect(computeRecurringEndDate('daily', '2024-02-10')).toBe('2024-02-29')
    })

    it('handles February in a non-leap year', () => {
      expect(computeRecurringEndDate('daily', '2023-02-10')).toBe('2023-02-28')
    })
  })

  describe('monthly', () => {
    it('adds monthsAhead months to the start date', () => {
      expect(computeRecurringEndDate('monthly', '2024-01-01', 3)).toBe('2024-04-01')
    })

    it('defaults to 3 months when monthsAhead is omitted', () => {
      expect(computeRecurringEndDate('monthly', '2024-01-01')).toBe('2024-04-01')
    })

    it('falls back to 3 months when monthsAhead is 0 (falsy)', () => {
      // parseInt(0) || 3 === 3 because 0 is falsy
      const result = computeRecurringEndDate('monthly', '2024-01-01', 0)
      expect(result).toBe('2024-04-01')
    })

    it('crosses a year boundary correctly (December + 3 months)', () => {
      expect(computeRecurringEndDate('monthly', '2024-12-15', 3)).toBe('2025-03-15')
    })
  })

  describe('yearly', () => {
    it('adds yearsAhead years to the start date', () => {
      expect(computeRecurringEndDate('yearly', '2024-01-01', undefined, 2)).toBe('2026-01-01')
    })

    it('defaults to 2 years when yearsAhead is omitted', () => {
      expect(computeRecurringEndDate('yearly', '2024-01-01')).toBe('2026-01-01')
    })

    it('falls back to 2 years when yearsAhead is 0 (falsy)', () => {
      // parseInt(0) || 2 === 2 because 0 is falsy
      expect(computeRecurringEndDate('yearly', '2024-01-01', undefined, 0)).toBe('2026-01-01')
    })
  })

  describe('userEndDate priority', () => {
    it('returns userEndDate for daily, overriding auto-computed end-of-month', () => {
      expect(computeRecurringEndDate('daily', '2024-01-15', undefined, undefined, '2024-06-30')).toBe('2024-06-30')
    })

    it('returns userEndDate for monthly, overriding monthsAhead calculation', () => {
      expect(computeRecurringEndDate('monthly', '2024-01-01', 3, undefined, '2025-12-31')).toBe('2025-12-31')
    })

    it('returns userEndDate for yearly, overriding yearsAhead calculation', () => {
      expect(computeRecurringEndDate('yearly', '2024-01-01', undefined, 2, '2030-01-01')).toBe('2030-01-01')
    })
  })

  describe('weekly / no auto-computed end date', () => {
    it('returns userEndDate when provided, since weekly has no auto-computation', () => {
      expect(computeRecurringEndDate('weekly', '2024-01-01', undefined, undefined, '2024-06-30')).toBe('2024-06-30')
    })

    it('returns empty string when no userEndDate is provided', () => {
      expect(computeRecurringEndDate('weekly', '2024-01-01')).toBe('')
    })
  })
})
