import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimerActions } from './useTimerActions'

const DATE = '2024-01-15'
const DATE2 = '2024-01-16'

const TASK = { id: 'ta', text: 'Math', priority: false, done: false }
const SCHED_TASK = { id: 'ta', text: 'Math', scheduledMinutes: 45, done: false }

const makeMusic = () => ({ play: vi.fn(), pause: vi.fn(), isPlaying: false })

const makeProps = (overrides = {}) => ({
  timerTask: null,
  dateKey: DATE,
  openTimer: vi.fn(),
  schedule: null,
  scheduleTimers: {},
  taskAllocations: {},
  setScheduleTimers: vi.fn(),
  setPendingTimerTask: vi.fn(),
  setPendingTimerMinutes: vi.fn(),
  resetPomodoroState: vi.fn(),
  toggleTask: vi.fn(),
  markScheduleItemUndone: vi.fn(),
  setRunningTaskId: vi.fn(),
  timerOriginDateKeyRef: { current: null },
  music: makeMusic(),
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useTimerActions', () => {
  describe('openTimerForTask', () => {
    it('opens the timer directly when the task already has scheduledMinutes', () => {
      const openTimer = vi.fn()
      const { result } = renderHook(() => useTimerActions(makeProps({ openTimer })))
      act(() => result.current.openTimerForTask(SCHED_TASK))
      expect(openTimer).toHaveBeenCalledWith(SCHED_TASK)
    })

    it('does not show the quick-timer prompt when task has scheduledMinutes', () => {
      const setPendingTimerTask = vi.fn()
      const { result } = renderHook(() => useTimerActions(makeProps({ setPendingTimerTask })))
      act(() => result.current.openTimerForTask(SCHED_TASK))
      expect(setPendingTimerTask).not.toHaveBeenCalled()
    })

    it('opens timer with schedule minutes when task is done and found in schedule', () => {
      const openTimer = vi.fn()
      const doneTask = { ...TASK, done: true }
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ openTimer, schedule: [SCHED_TASK] }))
      )
      act(() => result.current.openTimerForTask(doneTask))
      expect(openTimer).toHaveBeenCalledWith(expect.objectContaining({ id: 'ta', scheduledMinutes: 45 }))
    })

    it('falls back to 25 minutes when done task is not in schedule', () => {
      const openTimer = vi.fn()
      const doneTask = { ...TASK, done: true }
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ openTimer, schedule: [] }))
      )
      act(() => result.current.openTimerForTask(doneTask))
      expect(openTimer).toHaveBeenCalledWith(expect.objectContaining({ scheduledMinutes: 25 }))
    })

    it('sets the timer to full minutes when opening a done task', () => {
      const setScheduleTimers = vi.fn()
      const doneTask = { ...TASK, done: true }
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ setScheduleTimers, schedule: [SCHED_TASK] }))
      )
      act(() => result.current.openTimerForTask(doneTask))
      const updater = setScheduleTimers.mock.calls[0][0]
      expect(updater({})).toEqual({ ta: 45 * 60 })
    })

    it('opens timer with allocated minutes when task has elapsed time and an allocation', () => {
      const openTimer = vi.fn()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ openTimer, scheduleTimers: { ta: 300 }, taskAllocations: { ta: 40 } }))
      )
      act(() => result.current.openTimerForTask(TASK))
      expect(openTimer).toHaveBeenCalledWith(expect.objectContaining({ scheduledMinutes: 40 }))
    })

    it('shows the quick-timer prompt when task has no elapsed time and no allocation', () => {
      const setPendingTimerTask = vi.fn()
      const setPendingTimerMinutes = vi.fn()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ setPendingTimerTask, setPendingTimerMinutes }))
      )
      act(() => result.current.openTimerForTask(TASK))
      expect(setPendingTimerTask).toHaveBeenCalledWith(TASK)
      expect(setPendingTimerMinutes).toHaveBeenCalledWith(25)
    })

    it('shows the quick-timer prompt when elapsed > 0 but task has no allocation', () => {
      const setPendingTimerTask = vi.fn()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ setPendingTimerTask, scheduleTimers: { ta: 300 } }))
      )
      act(() => result.current.openTimerForTask(TASK))
      expect(setPendingTimerTask).toHaveBeenCalledWith(TASK)
    })
  })

  describe('restartTimer', () => {
    it('does nothing when timerTask is null', () => {
      const setRunningTaskId = vi.fn()
      const { result } = renderHook(() => useTimerActions(makeProps({ setRunningTaskId })))
      act(() => result.current.restartTimer())
      expect(setRunningTaskId).not.toHaveBeenCalled()
    })

    it('resets elapsed time to zero', () => {
      const setScheduleTimers = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, setScheduleTimers, music }))
      )
      act(() => result.current.restartTimer())
      const updater = setScheduleTimers.mock.calls[0][0]
      expect(updater({ ta: 900, tb: 300 })).toEqual({ ta: 0, tb: 300 })
    })

    it('resets pomodoro state', () => {
      const resetPomodoroState = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, resetPomodoroState, music }))
      )
      act(() => result.current.restartTimer())
      expect(resetPomodoroState).toHaveBeenCalled()
    })

    it('toggles the task undone using timerOriginDateKeyRef', () => {
      const toggleTask = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, toggleTask, timerOriginDateKeyRef: { current: DATE2 }, music }))
      )
      act(() => result.current.restartTimer())
      expect(toggleTask).toHaveBeenCalledWith(DATE2, 'ta')
    })

    it('falls back to dateKey when timerOriginDateKeyRef.current is null', () => {
      const toggleTask = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, toggleTask, timerOriginDateKeyRef: { current: null }, music }))
      )
      act(() => result.current.restartTimer())
      expect(toggleTask).toHaveBeenCalledWith(DATE, 'ta')
    })

    it('marks the schedule item undone', () => {
      const markScheduleItemUndone = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, markScheduleItemUndone, music }))
      )
      act(() => result.current.restartTimer())
      expect(markScheduleItemUndone).toHaveBeenCalledWith('ta')
    })

    it('starts the timer running and plays music', () => {
      const setRunningTaskId = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, setRunningTaskId, music }))
      )
      act(() => result.current.restartTimer())
      expect(setRunningTaskId).toHaveBeenCalledWith('ta')
      expect(music.play).toHaveBeenCalled()
    })
  })

  describe('startAgainTimer', () => {
    it('does nothing when timerTask is null', () => {
      const setRunningTaskId = vi.fn()
      const { result } = renderHook(() => useTimerActions(makeProps({ setRunningTaskId })))
      act(() => result.current.startAgainTimer())
      expect(setRunningTaskId).not.toHaveBeenCalled()
    })

    it('accumulates elapsed time into studyflow_focus_extra', () => {
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, scheduleTimers: { ta: 900 }, music }))
      )
      act(() => result.current.startAgainTimer())
      const stored = JSON.parse(localStorage.getItem('studyflow_focus_extra'))
      expect(stored[DATE]['ta']).toBe(900)
    })

    it('adds to existing stored time rather than overwriting it', () => {
      localStorage.setItem('studyflow_focus_extra', JSON.stringify({ [DATE]: { ta: 300 } }))
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, scheduleTimers: { ta: 600 }, music }))
      )
      act(() => result.current.startAgainTimer())
      const stored = JSON.parse(localStorage.getItem('studyflow_focus_extra'))
      expect(stored[DATE]['ta']).toBe(900)
    })

    it('skips the focus_extra write when elapsed is zero', () => {
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({ timerTask: TASK, scheduleTimers: {}, music }))
      )
      act(() => result.current.startAgainTimer())
      expect(localStorage.getItem('studyflow_focus_extra')).toBeNull()
    })

    it('uses timerOriginDateKeyRef for the focus_extra key', () => {
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({
          timerTask: TASK,
          scheduleTimers: { ta: 500 },
          timerOriginDateKeyRef: { current: DATE2 },
          music,
        }))
      )
      act(() => result.current.startAgainTimer())
      const stored = JSON.parse(localStorage.getItem('studyflow_focus_extra'))
      expect(stored[DATE2]['ta']).toBe(500)
      expect(stored[DATE]).toBeUndefined()
    })

    it('resets elapsed, undoes task, starts running, and plays music', () => {
      const setScheduleTimers = vi.fn()
      const resetPomodoroState = vi.fn()
      const toggleTask = vi.fn()
      const markScheduleItemUndone = vi.fn()
      const setRunningTaskId = vi.fn()
      const music = makeMusic()
      const { result } = renderHook(() =>
        useTimerActions(makeProps({
          timerTask: TASK,
          scheduleTimers: {},
          setScheduleTimers,
          resetPomodoroState,
          toggleTask,
          markScheduleItemUndone,
          setRunningTaskId,
          music,
        }))
      )
      act(() => result.current.startAgainTimer())
      expect(resetPomodoroState).toHaveBeenCalled()
      expect(markScheduleItemUndone).toHaveBeenCalledWith('ta')
      expect(setRunningTaskId).toHaveBeenCalledWith('ta')
      expect(music.play).toHaveBeenCalled()
    })
  })
})
