import { describe, it, expect, beforeEach } from 'vitest'
import { runMigrations } from './migrateScheduleStorage'
import { SCHEDULES_KEY, TIMERS_KEY } from './scheduleStorage'

describe('runMigrations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('schedule migration', () => {
    it('moves schedule_ keys into SCHEDULES_KEY', () => {
      localStorage.setItem('schedule_2024-01-01', JSON.stringify([{ id: 'a' }]))
      runMigrations()
      expect(JSON.parse(localStorage.getItem(SCHEDULES_KEY))).toEqual({ '2024-01-01': [{ id: 'a' }] })
    })

    it('removes the old schedule_ key after migration', () => {
      localStorage.setItem('schedule_2024-01-01', JSON.stringify([{ id: 'a' }]))
      runMigrations()
      expect(localStorage.getItem('schedule_2024-01-01')).toBeNull()
    })

    it('merges with existing data in SCHEDULES_KEY', () => {
      localStorage.setItem(SCHEDULES_KEY, JSON.stringify({ '2024-01-02': [{ id: 'b' }] }))
      localStorage.setItem('schedule_2024-01-03', JSON.stringify([{ id: 'c' }]))
      runMigrations()
      const schedules = JSON.parse(localStorage.getItem(SCHEDULES_KEY))
      expect(schedules['2024-01-02']).toEqual([{ id: 'b' }])
      expect(schedules['2024-01-03']).toEqual([{ id: 'c' }])
    })

    it('ignores empty schedule_ arrays', () => {
      localStorage.setItem('schedule_2024-01-01', JSON.stringify([]))
      runMigrations()
      expect(localStorage.getItem(SCHEDULES_KEY)).toBeNull()
    })
  })

  describe('timer migration', () => {
    it('moves schedule_timers_ keys into TIMERS_KEY', () => {
      localStorage.setItem('schedule_timers_2024-01-01', JSON.stringify({ taskId: 300 }))
      runMigrations()
      expect(JSON.parse(localStorage.getItem(TIMERS_KEY))).toEqual({ '2024-01-01': { taskId: 300 } })
    })

    it('removes the old schedule_timers_ key after migration', () => {
      localStorage.setItem('schedule_timers_2024-01-01', JSON.stringify({ taskId: 300 }))
      runMigrations()
      expect(localStorage.getItem('schedule_timers_2024-01-01')).toBeNull()
    })

    it('schedule_timers_ keys do NOT end up in SCHEDULES_KEY', () => {
      localStorage.setItem('schedule_timers_2024-01-01', JSON.stringify({ taskId: 300 }))
      runMigrations()
      expect(localStorage.getItem(SCHEDULES_KEY)).toBeNull()
    })
  })

  it('does nothing when localStorage has no legacy keys', () => {
    runMigrations()
    expect(localStorage.getItem(SCHEDULES_KEY)).toBeNull()
    expect(localStorage.getItem(TIMERS_KEY)).toBeNull()
  })
})
