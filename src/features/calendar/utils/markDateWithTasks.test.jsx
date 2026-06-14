import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { markDateWithTasks } from './markDateWithTasks'

// May 1 2025, local midnight — used as "today" for all tests
const TODAY = new Date(2025, 4, 1)
const PAST = new Date(2025, 3, 15)   // April 15 2025
const FUTURE = new Date(2025, 4, 15) // May 15 2025

const fmt = (date) => date.toLocaleDateString('en-CA')

const TODAY_KEY = fmt(TODAY)   // '2025-05-01'
const PAST_KEY = fmt(PAST)     // '2025-04-15'
const FUTURE_KEY = fmt(FUTURE) // '2025-05-15'

const daily = { id: 'r1', startDate: '2025-01-01', endDate: '', recurrence: 'daily' }

const props = (date, view = 'month') => ({ date, view })

const dot = (container) => container.querySelector('.rounded-full')
const check = (container) => container.querySelector('.text-secondary')
const cross = (container) => container.querySelector('.text-error')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
})
afterEach(() => vi.useRealTimers())

// ── view guard ────────────────────────────────────────────────────────────────

describe('non-month views', () => {
  it('returns null for year view', () => {
    const fn = markDateWithTasks({ [TODAY_KEY]: [{ id: '1', done: false }] }, fmt)
    expect(fn(props(TODAY, 'year'))).toBeNull()
  })

  it('returns null for decade view', () => {
    const fn = markDateWithTasks({ [TODAY_KEY]: [{ id: '1', done: false }] }, fmt)
    expect(fn(props(TODAY, 'decade'))).toBeNull()
  })
})

// ── no tasks ──────────────────────────────────────────────────────────────────

describe('no tasks for date', () => {
  it('returns null when tasks map is empty', () => {
    const fn = markDateWithTasks({}, fmt)
    expect(fn(props(TODAY))).toBeNull()
  })

  it('returns null when tasks exist for other dates only', () => {
    const fn = markDateWithTasks({ [PAST_KEY]: [{ id: '1', done: false }] }, fmt)
    expect(fn(props(FUTURE))).toBeNull()
  })

  it('returns null when no manual tasks and no recurring tasks', () => {
    const fn = markDateWithTasks({}, fmt, [])
    expect(fn(props(TODAY))).toBeNull()
  })
})

// ── default dot ───────────────────────────────────────────────────────────────

describe('default dot (showCompletion false)', () => {
  it('shows dot for a date with manual tasks', () => {
    const tasks = { [TODAY_KEY]: [{ id: '1', done: false }] }
    const fn = markDateWithTasks(tasks, fmt, [], false)
    const { container } = render(fn(props(TODAY)))
    expect(dot(container)).toBeTruthy()
  })

  it('shows dot for a date with only recurring tasks', () => {
    const fn = markDateWithTasks({}, fmt, [daily], false)
    const { container } = render(fn(props(TODAY)))
    expect(dot(container)).toBeTruthy()
  })

  it('shows dot for a future date even with showCompletion true', () => {
    const tasks = { [FUTURE_KEY]: [{ id: '1', done: true }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(FUTURE)))
    expect(dot(container)).toBeTruthy()
  })

  it('shows dot when showCompletion true but only recurring tasks on a past date', () => {
    // no manual task record → falls through to dot
    const fn = markDateWithTasks({}, fmt, [daily], true)
    const { container } = render(fn(props(PAST)))
    expect(dot(container)).toBeTruthy()
  })
})

// ── completion indicators ─────────────────────────────────────────────────────

describe('completion indicators (showCompletion true, past/today, manual tasks)', () => {
  it('shows ✓ checkmark when all tasks are done on a past date', () => {
    const tasks = { [PAST_KEY]: [{ id: '1', done: true }, { id: '2', done: true }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(PAST)))
    expect(check(container)).toBeTruthy()
    expect(check(container).textContent).toBe('✓')
    expect(cross(container)).toBeNull()
  })

  it('shows ✗ cross when some tasks are undone on a past date', () => {
    const tasks = { [PAST_KEY]: [{ id: '1', done: true }, { id: '2', done: false }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(PAST)))
    expect(cross(container)).toBeTruthy()
    expect(cross(container).textContent).toBe('✗')
    expect(check(container)).toBeNull()
  })

  it('shows ✗ cross when all tasks are undone on a past date', () => {
    const tasks = { [PAST_KEY]: [{ id: '1', done: false }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(PAST)))
    expect(cross(container)).toBeTruthy()
  })

  it('shows ✓ checkmark for today when all tasks are done', () => {
    const tasks = { [TODAY_KEY]: [{ id: '1', done: true }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(TODAY)))
    expect(check(container)).toBeTruthy()
  })

  it('shows dot (not completion) when showCompletion is false on a past date', () => {
    const tasks = { [PAST_KEY]: [{ id: '1', done: true }] }
    const fn = markDateWithTasks(tasks, fmt, [], false)
    const { container } = render(fn(props(PAST)))
    expect(dot(container)).toBeTruthy()
    expect(check(container)).toBeNull()
    expect(cross(container)).toBeNull()
  })
})

// ── edge: single undone task ──────────────────────────────────────────────────

describe('edge cases', () => {
  it('shows ✓ for a single done task', () => {
    const tasks = { [PAST_KEY]: [{ id: '1', done: true }] }
    const fn = markDateWithTasks(tasks, fmt, [], true)
    const { container } = render(fn(props(PAST)))
    expect(check(container)).toBeTruthy()
  })

  it('shows dot when tasks array is empty for a date key', () => {
    // manual record exists but is empty — treated as hasManual=false
    const fn = markDateWithTasks({ [TODAY_KEY]: [] }, fmt, [], false)
    expect(fn(props(TODAY))).toBeNull()
  })

  it('recurring task that does not apply to the date returns null', () => {
    // weekly recurring starting on a Monday; PAST is a Tuesday so it won't apply
    const weekly = { id: 'r2', startDate: '2025-04-14', endDate: '', recurrence: 'weekly' }
    const fn = markDateWithTasks({}, fmt, [weekly], false)
    expect(fn(props(PAST))).toBeNull()
  })

  it('does not show a dot for a recurring task on its skipped date', () => {
    const skipped = { ...daily, skippedDates: [TODAY_KEY] }
    const fn = markDateWithTasks({}, fmt, [skipped], false)
    expect(fn(props(TODAY))).toBeNull()
  })

  it('still shows a dot for a recurring task on a non-skipped date when another date is skipped', () => {
    const skipped = { ...daily, skippedDates: [PAST_KEY] }
    const fn = markDateWithTasks({}, fmt, [skipped], false)
    const { container } = render(fn(props(TODAY)))
    expect(dot(container)).toBeTruthy()
  })
})
