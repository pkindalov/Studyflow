import { describe, it, expect } from 'vitest'
import { en } from './en.jsx'
import { bg } from './bg.jsx'

const enKeys = Object.keys(en)
const bgKeys = Object.keys(bg)

// ── key parity ─────────────────────────────────────────────────────────────────

describe('key parity between en and bg', () => {
  it('bg contains every key that en has', () => {
    const missing = enKeys.filter((k) => !bgKeys.includes(k))
    expect(missing).toEqual([])
  })

  it('en contains every key that bg has — no bg-only extras', () => {
    const extra = bgKeys.filter((k) => !enKeys.includes(k))
    expect(extra).toEqual([])
  })

  it('all string-valued en keys are also strings in bg', () => {
    const stringKeys = enKeys.filter((k) => typeof en[k] === 'string')
    const wrongType = stringKeys.filter((k) => typeof bg[k] !== 'string')
    expect(wrongType).toEqual([])
  })

  it('all function-valued en keys are also functions in bg', () => {
    const fnKeys = enKeys.filter((k) => typeof en[k] === 'function')
    const wrongType = fnKeys.filter((k) => typeof bg[k] !== 'function')
    expect(wrongType).toEqual([])
  })
})

// ── function arity parity ──────────────────────────────────────────────────────

describe('function arity parity between en and bg', () => {
  it('every function-valued key has the same parameter count in both locales', () => {
    const fnKeys = enKeys.filter((k) => typeof en[k] === 'function')
    const mismatched = fnKeys.filter((k) => en[k].length !== bg[k].length)
    expect(mismatched).toEqual([])
  })
})

// ── string function output — en ────────────────────────────────────────────────

describe('string function output — en', () => {
  it('moreViewAll interpolates n', () => {
    expect(en.moreViewAll(3)).toBe('+3 more — view all')
  })

  it('repeatsEveryDayUntil interpolates month', () => {
    expect(en.repeatsEveryDayUntil('April')).toBe('Repeats every day until the end of April.')
  })

  it('nTotal interpolates n', () => {
    expect(en.nTotal(5)).toBe('5 total')
  })

  it('tasksCompletedFn — singular (1)', () => {
    expect(en.tasksCompletedFn(1)).toBe('1 task completed')
  })

  it('tasksCompletedFn — plural (2)', () => {
    expect(en.tasksCompletedFn(2)).toBe('2 tasks completed')
  })

  it('tasksCompletedFn — zero uses plural', () => {
    expect(en.tasksCompletedFn(0)).toBe('0 tasks completed')
  })

  it('selectedDayTasksFn — singular (1)', () => {
    expect(en.selectedDayTasksFn(1)).toBe('1 task done')
  })

  it('selectedDayTasksFn — plural (4)', () => {
    expect(en.selectedDayTasksFn(4)).toBe('4 tasks done')
  })

  it('pausedLeft interpolates time', () => {
    expect(en.pausedLeft('5:00')).toBe('paused · 5:00 left')
  })

  it('restoreConfirmFn interpolates date', () => {
    expect(en.restoreConfirmFn('Jan 1')).toBe(
      'This will replace all current data with the backup from Jan 1. The page will reload.'
    )
  })
})

// ── string function output — bg ────────────────────────────────────────────────

describe('string function output — bg', () => {
  it('moreViewAll interpolates n', () => {
    expect(bg.moreViewAll(3)).toBe('+3 още — виж всички')
  })

  it('repeatsEveryDayUntil interpolates month', () => {
    expect(bg.repeatsEveryDayUntil('Януари')).toBe('Повтаря се всеки ден до края на Януари.')
  })

  it('nTotal interpolates n', () => {
    expect(bg.nTotal(5)).toBe('5 общо')
  })

  it('tasksCompletedFn — singular (1)', () => {
    expect(bg.tasksCompletedFn(1)).toBe('1 задача завършена')
  })

  it('tasksCompletedFn — plural (2)', () => {
    expect(bg.tasksCompletedFn(2)).toBe('2 задачи завършени')
  })

  it('tasksCompletedFn — zero uses plural', () => {
    expect(bg.tasksCompletedFn(0)).toBe('0 задачи завършени')
  })

  it('selectedDayTasksFn — singular (1)', () => {
    expect(bg.selectedDayTasksFn(1)).toBe('1 задача завършена')
  })

  it('selectedDayTasksFn — plural (4)', () => {
    expect(bg.selectedDayTasksFn(4)).toBe('4 задачи завършени')
  })

  it('pausedLeft interpolates time', () => {
    expect(bg.pausedLeft('5:00')).toBe('пауза · 5:00 остават')
  })

  it('restoreConfirmFn interpolates date', () => {
    expect(bg.restoreConfirmFn('01.01.2024')).toBe(
      'Това ще замени всички текущи данни с резервното копие от 01.01.2024. Страницата ще се презареди.'
    )
  })

  it('excludedCountHint — singular vs plural (en)', () => {
    expect(en.excludedCountHint(1)).toBe('1 task excluded from schedule')
    expect(en.excludedCountHint(3)).toBe('3 tasks excluded from schedule')
  })

  it('excludedCountHint — singular vs plural (bg)', () => {
    expect(bg.excludedCountHint(1)).toBe('1 задача изключена от разписанието')
    expect(bg.excludedCountHint(3)).toBe('3 задачи изключени от разписанието')
  })

  it('repeatsEveryWeekOn — with and without a weekday', () => {
    expect(en.repeatsEveryWeekOn('Monday')).toBe('Repeats every Monday.')
    expect(en.repeatsEveryWeekOn('')).toBe('Repeats weekly.')
    expect(bg.repeatsEveryWeekOn('')).toBe('Повтаря се седмично.')
  })
})

// ── JSX help function output ───────────────────────────────────────────────────

describe('JSX help functions return a non-null value', () => {
  const b = (text) => text
  const stringFnKeys = new Set([
    'moreViewAll', 'repeatsEveryDayUntil', 'nTotal',
    'tasksCompletedFn', 'selectedDayTasksFn', 'pausedLeft', 'restoreConfirmFn',
    'summaryRingLabel', 'excludedCountHint', 'repeatsEveryWeekOn',
  ])
  const jsxFnKeys = enKeys.filter((k) => typeof en[k] === 'function' && !stringFnKeys.has(k))

  it('en — all JSX help functions return non-null', () => {
    jsxFnKeys.forEach((key) => {
      expect(en[key](b), key).not.toBeNull()
      expect(en[key](b), key).toBeDefined()
    })
  })

  it('bg — all JSX help functions return non-null', () => {
    jsxFnKeys.forEach((key) => {
      expect(bg[key](b), key).not.toBeNull()
      expect(bg[key](b), key).toBeDefined()
    })
  })
})
