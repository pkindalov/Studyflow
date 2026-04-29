import { describe, it, expect, beforeEach } from 'vitest'
import {
  SCHEDULES_KEY,
  TIMERS_KEY,
  readAllSchedules,
  readAllTimers,
  writeScheduleForDate,
  writeTimersForDate,
} from './scheduleStorage'

beforeEach(() => {
  localStorage.clear()
})

describe('readAllSchedules', () => {
  it('returns empty object when nothing stored', () => {
    expect(readAllSchedules()).toEqual({})
  })

  it('returns parsed data from localStorage', () => {
    const data = { '2024-01-01': [{ id: 'a', text: 'Math', scheduledMinutes: 30 }] }
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(data))
    expect(readAllSchedules()).toEqual(data)
  })

  it('returns empty object on invalid JSON', () => {
    localStorage.setItem(SCHEDULES_KEY, 'not-json')
    expect(readAllSchedules()).toEqual({})
  })
})

describe('readAllTimers', () => {
  it('returns empty object when nothing stored', () => {
    expect(readAllTimers()).toEqual({})
  })

  it('returns parsed data from localStorage', () => {
    const data = { '2024-01-01': { 'task-1': 900 } }
    localStorage.setItem(TIMERS_KEY, JSON.stringify(data))
    expect(readAllTimers()).toEqual(data)
  })

  it('returns empty object on invalid JSON', () => {
    localStorage.setItem(TIMERS_KEY, 'bad-json')
    expect(readAllTimers()).toEqual({})
  })
})

describe('writeScheduleForDate', () => {
  it('saves a schedule for a date', () => {
    const schedule = [{ id: 'a', text: 'Math', scheduledMinutes: 30 }]
    writeScheduleForDate('2024-01-01', schedule)
    expect(readAllSchedules()['2024-01-01']).toEqual(schedule)
  })

  it('preserves other dates when writing', () => {
    const schedA = [{ id: 'a', text: 'Math', scheduledMinutes: 30 }]
    const schedB = [{ id: 'b', text: 'English', scheduledMinutes: 20 }]
    writeScheduleForDate('2024-01-01', schedA)
    writeScheduleForDate('2024-01-02', schedB)
    const all = readAllSchedules()
    expect(all['2024-01-01']).toEqual(schedA)
    expect(all['2024-01-02']).toEqual(schedB)
  })

  it('removes the date key when schedule is null', () => {
    writeScheduleForDate('2024-01-01', [{ id: 'a', text: 'Math', scheduledMinutes: 30 }])
    writeScheduleForDate('2024-01-01', null)
    expect(readAllSchedules()['2024-01-01']).toBeUndefined()
  })

  it('removes the date key when schedule is an empty array', () => {
    writeScheduleForDate('2024-01-01', [{ id: 'a', text: 'Math', scheduledMinutes: 30 }])
    writeScheduleForDate('2024-01-01', [])
    expect(readAllSchedules()['2024-01-01']).toBeUndefined()
  })

  it('does not remove other dates when clearing one', () => {
    const schedB = [{ id: 'b', text: 'English', scheduledMinutes: 20 }]
    writeScheduleForDate('2024-01-01', [{ id: 'a', text: 'Math', scheduledMinutes: 30 }])
    writeScheduleForDate('2024-01-02', schedB)
    writeScheduleForDate('2024-01-01', null)
    expect(readAllSchedules()['2024-01-02']).toEqual(schedB)
  })
})

describe('writeTimersForDate', () => {
  it('saves timers for a date', () => {
    writeTimersForDate('2024-01-01', { 'task-1': 900 })
    expect(readAllTimers()['2024-01-01']).toEqual({ 'task-1': 900 })
  })

  it('preserves other dates when writing', () => {
    writeTimersForDate('2024-01-01', { 'task-1': 900 })
    writeTimersForDate('2024-01-02', { 'task-2': 600 })
    const all = readAllTimers()
    expect(all['2024-01-01']).toEqual({ 'task-1': 900 })
    expect(all['2024-01-02']).toEqual({ 'task-2': 600 })
  })

  it('removes the date key when timers object is empty', () => {
    writeTimersForDate('2024-01-01', { 'task-1': 900 })
    writeTimersForDate('2024-01-01', {})
    expect(readAllTimers()['2024-01-01']).toBeUndefined()
  })

  it('removes the date key when timers is null', () => {
    writeTimersForDate('2024-01-01', { 'task-1': 900 })
    writeTimersForDate('2024-01-01', null)
    expect(readAllTimers()['2024-01-01']).toBeUndefined()
  })

  it('does not remove other dates when clearing one', () => {
    writeTimersForDate('2024-01-01', { 'task-1': 900 })
    writeTimersForDate('2024-01-02', { 'task-2': 600 })
    writeTimersForDate('2024-01-01', null)
    expect(readAllTimers()['2024-01-02']).toEqual({ 'task-2': 600 })
  })
})
