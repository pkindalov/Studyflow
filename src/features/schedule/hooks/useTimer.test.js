import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from './useTimer'
import { readAllTimers, writeTimersForDate } from '../utils/scheduleStorage'

vi.mock('../utils/scheduleStorage', () => ({
  TIMERS_KEY: 'studyflow_schedule_timers',
  readAllTimers: vi.fn(() => ({})),
  writeTimersForDate: vi.fn(),
}))

const makeMusic = () => ({
  isPlaying: false,
  play: vi.fn(),
  pause: vi.fn(),
  togglePlay: vi.fn(),
})

const makeTask = (overrides = {}) => ({
  id: 'task-1',
  text: 'Study Math',
  scheduledMinutes: 30,
  ...overrides,
})

const DATE = '2025-05-01'
const DATE2 = '2025-05-02'

// Stable setup — music and markTaskDone are captured for assertion
const setup = ({ dateKey = DATE } = {}) => {
  const music = makeMusic()
  const markTaskDone = vi.fn()
  const hook = renderHook(() => useTimer({ dateKey, music, markTaskDone }))
  return { ...hook, music, markTaskDone }
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  readAllTimers.mockReturnValue({})
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('timerTask is null', () => {
    const { result } = setup()
    expect(result.current.timerTask).toBeNull()
  })

  it('runningTaskId is null', () => {
    const { result } = setup()
    expect(result.current.runningTaskId).toBeNull()
  })

  it('scheduleTimers is empty', () => {
    const { result } = setup()
    expect(result.current.scheduleTimers).toEqual({})
  })

  it('pomodoroEnabled defaults to false', () => {
    const { result } = setup()
    expect(result.current.pomodoroEnabled).toBe(false)
  })

  it('pomodoroMinutes defaults to 25', () => {
    const { result } = setup()
    expect(result.current.pomodoroMinutes).toBe(25)
  })

  it('hydrates pomodoroEnabled from localStorage', () => {
    localStorage.setItem('pomodoro_enabled', 'true')
    const { result } = setup()
    expect(result.current.pomodoroEnabled).toBe(true)
  })

  it('hydrates pomodoroMinutes from localStorage', () => {
    localStorage.setItem('pomodoro_minutes', '45')
    const { result } = setup()
    expect(result.current.pomodoroMinutes).toBe(45)
  })
})

// ── Pomodoro localStorage persistence ─────────────────────────────────────────

describe('pomodoro localStorage persistence', () => {
  it('persists pomodoroEnabled changes', () => {
    const { result } = setup()
    act(() => result.current.setPomodoroEnabled(true))
    expect(localStorage.getItem('pomodoro_enabled')).toBe('true')
  })

  it('persists pomodoroMinutes via handleSetPomodoroMinutes', () => {
    const { result } = setup()
    act(() => result.current.handleSetPomodoroMinutes(45))
    expect(localStorage.getItem('pomodoro_minutes')).toBe('45')
  })
})

// ── Timer storage persistence ─────────────────────────────────────────────────

describe('timer storage persistence', () => {
  it('writes scheduleTimers to storage when they change', () => {
    const { result } = setup()
    writeTimersForDate.mockClear() // discard any initialization writes
    act(() => result.current.setScheduleTimers({ 'task-1': 42 }))
    expect(writeTimersForDate).toHaveBeenCalledWith(DATE, { 'task-1': 42 })
  })
})

// ── Date key change ───────────────────────────────────────────────────────────

describe('dateKey change', () => {
  it('loads stored timers for the new date', () => {
    const music = makeMusic()
    const markTaskDone = vi.fn()
    const { result, rerender } = renderHook(
      ({ dateKey }) => useTimer({ dateKey, music, markTaskDone }),
      { initialProps: { dateKey: DATE } },
    )
    readAllTimers.mockReturnValue({ [DATE2]: { 'task-2': 120 } })
    act(() => rerender({ dateKey: DATE2 }))
    expect(result.current.scheduleTimers['task-2']).toBe(120)
  })

  it('preserves the active task elapsed when switching dates', () => {
    const music = makeMusic()
    const markTaskDone = vi.fn()
    const task = makeTask()
    const { result, rerender } = renderHook(
      ({ dateKey }) => useTimer({ dateKey, music, markTaskDone }),
      { initialProps: { dateKey: DATE } },
    )
    act(() => result.current.openTimer(task))
    act(() => result.current.setScheduleTimers({ 'task-1': 300 }))
    readAllTimers.mockReturnValue({ [DATE2]: {} })
    act(() => rerender({ dateKey: DATE2 }))
    expect(result.current.scheduleTimers['task-1']).toBe(300)
  })
})

// ── openTimer ─────────────────────────────────────────────────────────────────

describe('openTimer', () => {
  it('sets timerTask', () => {
    const { result } = setup()
    const task = makeTask()
    act(() => result.current.openTimer(task))
    expect(result.current.timerTask).toEqual(task)
  })

  it('starts running when elapsed < total', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    expect(result.current.runningTaskId).toBe('task-1')
  })

  it('sets taskAllocations for the task', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    expect(result.current.taskAllocations['task-1']).toBe(30)
  })

  it('un-minimizes without switching if the same task is already open', () => {
    const { result } = setup()
    const task = makeTask()
    act(() => result.current.openTimer(task))
    act(() => result.current.setIsTimerMinimized(true))
    act(() => result.current.openTimer(task))
    expect(result.current.isTimerMinimized).toBe(false)
    expect(result.current.pendingSwitchTask).toBeNull()
    expect(result.current.timerTask).toEqual(task)
  })

  it('sets pendingSwitchTask when a different task is already open', () => {
    const { result } = setup()
    const task1 = makeTask({ id: 'task-1' })
    const task2 = makeTask({ id: 'task-2' })
    act(() => result.current.openTimer(task1))
    act(() => result.current.openTimer(task2))
    expect(result.current.pendingSwitchTask).toEqual(task2)
    expect(result.current.timerTask).toEqual(task1) // unchanged
  })

  it('does not start running when elapsed already equals total', () => {
    readAllTimers.mockReturnValue({ [DATE]: { 'task-1': 1800 } })
    const { result } = setup()
    act(() => result.current.openTimer(makeTask())) // scheduledMinutes: 30 → 1800s
    expect(result.current.runningTaskId).toBeNull()
  })
})

// ── closeTimer ────────────────────────────────────────────────────────────────

describe('closeTimer', () => {
  it('clears timerTask', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.closeTimer())
    expect(result.current.timerTask).toBeNull()
  })

  it('clears runningTaskId', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.closeTimer())
    expect(result.current.runningTaskId).toBeNull()
  })

  it('calls music.pause()', () => {
    const { result, music } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.closeTimer())
    expect(music.pause).toHaveBeenCalled()
  })
})

// ── toggleTimer ───────────────────────────────────────────────────────────────

describe('toggleTimer', () => {
  it('does nothing when no timerTask', () => {
    const { result, music } = setup()
    act(() => result.current.toggleTimer())
    expect(music.pause).not.toHaveBeenCalled()
    expect(music.play).not.toHaveBeenCalled()
  })

  it('pauses when running: clears runningTaskId and calls music.pause()', () => {
    const { result, music } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.toggleTimer())
    expect(result.current.runningTaskId).toBeNull()
    expect(music.pause).toHaveBeenCalled()
  })

  it('resumes from fresh start: sets runningTaskId and calls music.play()', () => {
    const { result, music } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.toggleTimer()) // pause
    music.play.mockClear()
    act(() => result.current.toggleTimer()) // resume with elapsed === 0
    expect(result.current.runningTaskId).toBe('task-1')
    expect(music.play).toHaveBeenCalled()
  })
})

// ── markTimerTaskDone ─────────────────────────────────────────────────────────

describe('markTimerTaskDone', () => {
  it('does nothing when no timerTask', () => {
    const { result, markTaskDone } = setup()
    act(() => result.current.markTimerTaskDone())
    expect(markTaskDone).not.toHaveBeenCalled()
  })

  it('calls markTaskDone with the correct dateKey and taskId', () => {
    const { result, markTaskDone } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.markTimerTaskDone())
    expect(markTaskDone).toHaveBeenCalledWith(DATE, 'task-1')
  })

  it('clears timerTask and runningTaskId', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.markTimerTaskDone())
    expect(result.current.timerTask).toBeNull()
    expect(result.current.runningTaskId).toBeNull()
  })

  it('sets scheduleTimers to the full duration', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask())) // 30 min → 1800s
    act(() => result.current.markTimerTaskDone())
    expect(result.current.scheduleTimers['task-1']).toBe(1800)
  })

  it('calls music.pause()', () => {
    const { result, music } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.markTimerTaskDone())
    expect(music.pause).toHaveBeenCalled()
  })
})

// ── confirmSwitchTask ─────────────────────────────────────────────────────────

describe('confirmSwitchTask', () => {
  const task1 = makeTask({ id: 'task-1' })
  const task2 = makeTask({ id: 'task-2', text: 'Study English' })

  it('does nothing when no pendingSwitchTask', () => {
    const { result } = setup()
    act(() => result.current.confirmSwitchTask())
    expect(result.current.timerTask).toBeNull()
  })

  it('switches timerTask to the pending task', () => {
    const { result } = setup()
    act(() => result.current.openTimer(task1))
    act(() => result.current.openTimer(task2))
    act(() => result.current.confirmSwitchTask())
    expect(result.current.timerTask).toEqual(task2)
  })

  it('clears pendingSwitchTask after confirming', () => {
    const { result } = setup()
    act(() => result.current.openTimer(task1))
    act(() => result.current.openTimer(task2))
    act(() => result.current.confirmSwitchTask())
    expect(result.current.pendingSwitchTask).toBeNull()
  })

  it('calls music.pause() on switch', () => {
    const { result, music } = setup()
    act(() => result.current.openTimer(task1))
    act(() => result.current.openTimer(task2))
    music.pause.mockClear()
    act(() => result.current.confirmSwitchTask())
    expect(music.pause).toHaveBeenCalled()
  })

  it('starts running the new task when elapsed < total', () => {
    const { result } = setup()
    act(() => result.current.openTimer(task1))
    act(() => result.current.openTimer(task2))
    act(() => result.current.confirmSwitchTask())
    expect(result.current.runningTaskId).toBe('task-2')
  })
})

// ── resetTimer ────────────────────────────────────────────────────────────────

describe('resetTimer', () => {
  it('clears all timer state', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.resetTimer())
    expect(result.current.timerTask).toBeNull()
    expect(result.current.runningTaskId).toBeNull()
    expect(result.current.scheduleTimers).toEqual({})
    expect(result.current.taskAllocations).toEqual({})
    expect(result.current.isTimerMinimized).toBe(false)
  })
})

// ── resetPomodoroState ────────────────────────────────────────────────────────

describe('resetPomodoroState', () => {
  it('resets pomodoroResetAt and pomodoroBreakCount to 0', () => {
    const { result } = setup()
    act(() => result.current.resetPomodoroState())
    expect(result.current.pomodoroResetAt).toBe(0)
    expect(result.current.pomodoroBreakCount).toBe(0)
  })
})

// ── handleSetPomodoroMinutes ──────────────────────────────────────────────────

describe('handleSetPomodoroMinutes', () => {
  it('updates pomodoroMinutes', () => {
    const { result } = setup()
    act(() => result.current.handleSetPomodoroMinutes(45))
    expect(result.current.pomodoroMinutes).toBe(45)
  })

  it('resets pomodoroBreakCount to 0', () => {
    const { result } = setup()
    act(() => result.current.handleSetPomodoroMinutes(45))
    expect(result.current.pomodoroBreakCount).toBe(0)
  })

  it('anchors pomodoroResetAt to the current elapsed of the active task', () => {
    const { result } = setup()
    const task = makeTask()
    act(() => result.current.openTimer(task))
    act(() => result.current.setScheduleTimers({ 'task-1': 600 }))
    act(() => result.current.handleSetPomodoroMinutes(20))
    expect(result.current.pomodoroResetAt).toBe(600)
  })
})

// ── handleMainMusicToggle ─────────────────────────────────────────────────────

describe('handleMainMusicToggle', () => {
  it('calls music.togglePlay()', () => {
    const { result, music } = setup()
    act(() => result.current.handleMainMusicToggle())
    expect(music.togglePlay).toHaveBeenCalled()
  })
})

// ── Document title ────────────────────────────────────────────────────────────

describe('document title', () => {
  it('shows "StudyFlow" when no timer is open', () => {
    setup()
    expect(document.title).toBe('StudyFlow')
  })

  it('shows running title when timer is active', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    expect(document.title).toBe('⏱ Study Math — StudyFlow')
  })

  it('shows paused title when timer is paused', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.toggleTimer()) // pause
    expect(document.title).toBe('⏸ Paused — StudyFlow')
  })

  it('resets to "StudyFlow" when timer is closed', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => result.current.closeTimer())
    expect(document.title).toBe('StudyFlow')
  })
})

// ── Countdown interval ────────────────────────────────────────────────────────

describe('countdown interval', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('increments elapsed by 1 each second', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.scheduleTimers['task-1']).toBe(5)
  })

  it('caps elapsed at totalSeconds', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask({ scheduledMinutes: 1 }))) // 60s
    act(() => vi.advanceTimersByTime(120_000)) // 2 minutes
    expect(result.current.scheduleTimers['task-1']).toBe(60)
  })

  it('stops ticking when toggleTimer pauses', () => {
    const { result } = setup()
    act(() => result.current.openTimer(makeTask()))
    act(() => vi.advanceTimersByTime(3000))
    act(() => result.current.toggleTimer()) // pause
    const elapsed = result.current.scheduleTimers['task-1']
    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.scheduleTimers['task-1']).toBe(elapsed) // unchanged
  })
})

// ── Completion detection ──────────────────────────────────────────────────────

describe('completion detection', () => {
  it('calls markTaskDone when elapsed reaches totalSeconds', () => {
    const { result, markTaskDone } = setup()
    const task = makeTask()
    act(() => result.current.openTimer(task))
    act(() => result.current.setScheduleTimers({ 'task-1': task.scheduledMinutes * 60 }))
    expect(markTaskDone).toHaveBeenCalledWith(DATE, 'task-1')
  })

  it('clears runningTaskId on completion', () => {
    const { result } = setup()
    const task = makeTask()
    act(() => result.current.openTimer(task))
    act(() => result.current.setScheduleTimers({ 'task-1': task.scheduledMinutes * 60 }))
    expect(result.current.runningTaskId).toBeNull()
  })
})

// ── Pomodoro break detection ──────────────────────────────────────────────────

describe('pomodoro break detection', () => {
  it('pauses and increments breakCount at a pomodoro boundary', () => {
    const { result, music } = setup()
    act(() => result.current.setPomodoroEnabled(true))
    // pomodoroMinutes = 25 → first break at 1500s
    const task = makeTask({ scheduledMinutes: 60 }) // 3600s total so completion won't trigger
    act(() => result.current.openTimer(task))
    music.pause.mockClear()
    act(() => result.current.setScheduleTimers({ 'task-1': 1500 }))
    expect(result.current.pomodoroBreakCount).toBe(1)
    expect(result.current.runningTaskId).toBeNull()
    expect(music.pause).toHaveBeenCalled()
  })

  it('does not trigger a break when pomodoro is disabled', () => {
    const { result } = setup()
    // pomodoroEnabled is false by default
    const task = makeTask({ scheduledMinutes: 60 })
    act(() => result.current.openTimer(task))
    act(() => result.current.setScheduleTimers({ 'task-1': 1500 }))
    expect(result.current.pomodoroBreakCount).toBe(0)
    expect(result.current.runningTaskId).toBe('task-1') // still running
  })
})
