import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActivityStats } from './useActivityStats'

// Pin "today" to a fixed date so streak tests are deterministic
const TODAY = '2024-06-15'
const YESTERDAY = '2024-06-14'
const TWO_DAYS_AGO = '2024-06-13'

const done = (id) => ({ id, done: true })
const notDone = (id) => ({ id, done: false })
const tasks = (map) => map // alias for readability

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(`${TODAY}T12:00:00`))
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useActivityStats', () => {
  describe('heatmap', () => {
    it('maps dates to their done-task count', () => {
      const { result } = renderHook(() =>
        useActivityStats({ [TODAY]: [done('a'), done('b'), notDone('c')] })
      )
      expect(result.current.heatmap[TODAY]).toBe(2)
    })

    it('omits dates with no done tasks', () => {
      const { result } = renderHook(() =>
        useActivityStats({ [TODAY]: [notDone('a')] })
      )
      expect(result.current.heatmap[TODAY]).toBeUndefined()
    })

    it('is empty when the tasks map is empty', () => {
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.heatmap).toEqual({})
    })
  })

  describe('activeToday', () => {
    it('is true when today has at least one done task', () => {
      const { result } = renderHook(() =>
        useActivityStats({ [TODAY]: [done('a')] })
      )
      expect(result.current.activeToday).toBe(true)
    })

    it('is false when today has no done tasks', () => {
      const { result } = renderHook(() =>
        useActivityStats({ [TODAY]: [notDone('a')] })
      )
      expect(result.current.activeToday).toBe(false)
    })

    it('is false when today has no tasks at all', () => {
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.activeToday).toBe(false)
    })
  })

  describe('streak', () => {
    it('is 0 with no done tasks', () => {
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.streak).toBe(0)
    })

    it('is 1 when only today has done tasks', () => {
      const { result } = renderHook(() =>
        useActivityStats({ [TODAY]: [done('a')] })
      )
      expect(result.current.streak).toBe(1)
    })

    it('counts consecutive days including today', () => {
      const { result } = renderHook(() =>
        useActivityStats({
          [TODAY]: [done('a')],
          [YESTERDAY]: [done('b')],
          [TWO_DAYS_AGO]: [done('c')],
        })
      )
      expect(result.current.streak).toBe(3)
    })

    it('stops at a gap — does not count days before the gap', () => {
      const { result } = renderHook(() =>
        useActivityStats({
          [TODAY]: [done('a')],
          // YESTERDAY has no done tasks → gap
          [TWO_DAYS_AGO]: [done('c')],
        })
      )
      expect(result.current.streak).toBe(1)
    })

    it('counts a streak starting from yesterday when today is inactive', () => {
      const { result } = renderHook(() =>
        useActivityStats({
          [YESTERDAY]: [done('b')],
          [TWO_DAYS_AGO]: [done('c')],
        })
      )
      expect(result.current.streak).toBe(2)
    })
  })

  describe('totalFocusSeconds', () => {
    it('is 0 when no timer data in localStorage', () => {
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.totalFocusSeconds).toBe(0)
    })

    it('sums seconds across all dates and tasks', () => {
      localStorage.setItem(
        'studyflow_schedule_timers',
        JSON.stringify({ '2024-06-14': { taskA: 300, taskB: 120 }, '2024-06-13': { taskC: 60 } })
      )
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.totalFocusSeconds).toBe(480)
    })

    it('reports todayFocusSeconds separately', () => {
      localStorage.setItem(
        'studyflow_schedule_timers',
        JSON.stringify({ [TODAY]: { taskA: 600 }, [YESTERDAY]: { taskB: 200 } })
      )
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.todayFocusSeconds).toBe(600)
    })

    it('ignores non-positive timer values', () => {
      localStorage.setItem(
        'studyflow_schedule_timers',
        JSON.stringify({ [TODAY]: { taskA: -100, taskB: 0 } })
      )
      const { result } = renderHook(() => useActivityStats({}))
      expect(result.current.totalFocusSeconds).toBe(0)
    })
  })
})
