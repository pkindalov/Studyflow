import { describe, it, expect } from 'vitest'
import { getSeasonForDate, SEASONS } from './seasons'

describe('getSeasonForDate', () => {
  it('maps December, January, February to winter', () => {
    expect(getSeasonForDate(new Date(2026, 11, 15))).toBe('winter')
    expect(getSeasonForDate(new Date(2026, 0, 1))).toBe('winter')
    expect(getSeasonForDate(new Date(2026, 1, 28))).toBe('winter')
  })

  it('maps March, April, May to spring', () => {
    expect(getSeasonForDate(new Date(2026, 2, 1))).toBe('spring')
    expect(getSeasonForDate(new Date(2026, 3, 15))).toBe('spring')
    expect(getSeasonForDate(new Date(2026, 4, 31))).toBe('spring')
  })

  it('maps June, July, August to summer', () => {
    expect(getSeasonForDate(new Date(2026, 5, 1))).toBe('summer')
    expect(getSeasonForDate(new Date(2026, 6, 20))).toBe('summer')
    expect(getSeasonForDate(new Date(2026, 7, 31))).toBe('summer')
  })

  it('maps September, October, November to autumn', () => {
    expect(getSeasonForDate(new Date(2026, 8, 1))).toBe('autumn')
    expect(getSeasonForDate(new Date(2026, 9, 15))).toBe('autumn')
    expect(getSeasonForDate(new Date(2026, 10, 30))).toBe('autumn')
  })

  it('defaults to the current date when no argument is given', () => {
    expect(SEASONS.map((s) => s.id)).toContain(getSeasonForDate())
  })
})

describe('SEASONS', () => {
  it('lists exactly the four Bulgarian meteorological seasons', () => {
    expect(SEASONS.map((s) => s.id)).toEqual(['spring', 'summer', 'autumn', 'winter'])
  })

  it('gives every season a distinct icon', () => {
    const icons = new Set(SEASONS.map((s) => s.icon))
    expect(icons.size).toBe(SEASONS.length)
  })
})
