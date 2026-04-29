import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSchedule } from './useSchedule'
import { readAllSchedules, writeScheduleForDate } from '../utils/scheduleStorage'

const DATE = '2024-01-15'
const DATE2 = '2024-01-16'

const TASK_A = { id: 'ta', text: 'Math', priority: true, done: false }
const TASK_B = { id: 'tb', text: 'Physics', priority: false, done: false }

const SCHED_A = { id: 'ta', text: 'Math', scheduledMinutes: 60, done: false, priority: true }
const SCHED_B = { id: 'tb', text: 'Physics', scheduledMinutes: 30, done: false, priority: false }

const T = {
  scheduleSaved: 'Saved',
  scheduleError: 'Error',
  scheduleDeleted: 'Deleted',
  scheduleDeleteError: 'Delete error',
}

const makeProps = (overrides = {}) => ({
  dateKey: DATE,
  tasksForDay: [],
  excludedTaskIds: new Set(),
  totalStudyTime: 2,
  priorityPercent: 60,
  scheduleTimers: {},
  setScheduleTimers: vi.fn(),
  runningTaskId: null,
  setRunningTaskId: vi.fn(),
  markTaskDone: vi.fn(),
  showNotification: vi.fn(),
  t: T,
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useSchedule', () => {
  describe('initial state', () => {
    it('starts with null schedule when nothing in localStorage', () => {
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.schedule).toBeNull()
    })

    it('starts with scheduleUnsaved false', () => {
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.scheduleUnsaved).toBe(false)
    })

    it('loads existing schedule from localStorage on mount', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.schedule).toHaveLength(2)
      expect(result.current.schedule[0].id).toBe('ta')
    })
  })

  describe('dateKey change', () => {
    it('loads the new date schedule when dateKey changes', () => {
      writeScheduleForDate(DATE2, [SCHED_B])
      const { result, rerender } = renderHook((props) => useSchedule(props), {
        initialProps: makeProps(),
      })
      rerender(makeProps({ dateKey: DATE2 }))
      expect(result.current.schedule).toHaveLength(1)
      expect(result.current.schedule[0].id).toBe('tb')
    })

    it('sets schedule to null when new date has no saved schedule', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result, rerender } = renderHook((props) => useSchedule(props), {
        initialProps: makeProps(),
      })
      expect(result.current.schedule).toHaveLength(1)
      rerender(makeProps({ dateKey: DATE2 }))
      expect(result.current.schedule).toBeNull()
    })

    it('resets scheduleUnsaved to false on dateKey change', () => {
      const { result, rerender } = renderHook((props) => useSchedule(props), {
        initialProps: makeProps({ tasksForDay: [TASK_A] }),
      })
      act(() => result.current.generateSchedule())
      expect(result.current.scheduleUnsaved).toBe(true)
      rerender(makeProps({ dateKey: DATE2 }))
      expect(result.current.scheduleUnsaved).toBe(false)
    })
  })

  describe('allScheduleDone', () => {
    it('is false when schedule is null', () => {
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.allScheduleDone).toBe(false)
    })

    it('is false when tasks are undone with no elapsed time', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.allScheduleDone).toBe(false)
    })

    it('is true when all tasks are marked done', () => {
      writeScheduleForDate(DATE, [{ ...SCHED_A, done: true }, { ...SCHED_B, done: true }])
      const { result } = renderHook(() => useSchedule(makeProps()))
      expect(result.current.allScheduleDone).toBe(true)
    })

    it('is true when all tasks have fully elapsed timers', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const timers = {
        ta: SCHED_A.scheduledMinutes * 60,
        tb: SCHED_B.scheduledMinutes * 60,
      }
      const { result } = renderHook(() => useSchedule(makeProps({ scheduleTimers: timers })))
      expect(result.current.allScheduleDone).toBe(true)
    })

    it('is false when only some tasks have elapsed timers', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() =>
        useSchedule(makeProps({ scheduleTimers: { ta: SCHED_A.scheduledMinutes * 60 } }))
      )
      expect(result.current.allScheduleDone).toBe(false)
    })
  })

  describe('generateSchedule', () => {
    it('calls onNeedsTasks when tasksForDay is empty', () => {
      const onNeedsTasks = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.generateSchedule(onNeedsTasks))
      expect(onNeedsTasks).toHaveBeenCalled()
      expect(result.current.schedule).toBeNull()
    })

    it('calls onNeedsTasks when all tasks are excluded', () => {
      const onNeedsTasks = vi.fn()
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A], excludedTaskIds: new Set(['ta']) }))
      )
      act(() => result.current.generateSchedule(onNeedsTasks))
      expect(onNeedsTasks).toHaveBeenCalled()
    })

    it('calls onNeedsTasks when all tasks are already done', () => {
      const onNeedsTasks = vi.fn()
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [{ ...TASK_A, done: true }] }))
      )
      act(() => result.current.generateSchedule(onNeedsTasks))
      expect(onNeedsTasks).toHaveBeenCalled()
    })

    it('generates a schedule and sets scheduleUnsaved to true', () => {
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A, TASK_B] }))
      )
      act(() => result.current.generateSchedule())
      expect(result.current.schedule).not.toBeNull()
      expect(result.current.schedule.length).toBeGreaterThan(0)
      expect(result.current.scheduleUnsaved).toBe(true)
    })

    it('shows unsaved warning instead of generating when an unsaved schedule exists', () => {
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A] }))
      )
      act(() => result.current.generateSchedule())
      expect(result.current.scheduleUnsaved).toBe(true)
      act(() => result.current.generateSchedule())
      expect(result.current.showUnsavedWarning).toBe(true)
    })
  })

  describe('saveSchedule', () => {
    it('persists the current schedule to localStorage', () => {
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A] }))
      )
      act(() => result.current.generateSchedule())
      act(() => result.current.saveSchedule())
      const persisted = readAllSchedules()[DATE]
      expect(persisted).toHaveLength(1)
      expect(persisted[0].id).toBe('ta')
    })

    it('calls showNotification with scheduleSaved message', () => {
      const showNotification = vi.fn()
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps({ showNotification })))
      act(() => result.current.saveSchedule())
      expect(showNotification).toHaveBeenCalledWith(T.scheduleSaved)
    })

    it('sets scheduleUnsaved to false', () => {
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A] }))
      )
      act(() => result.current.generateSchedule())
      expect(result.current.scheduleUnsaved).toBe(true)
      act(() => result.current.saveSchedule())
      expect(result.current.scheduleUnsaved).toBe(false)
    })

    it('does nothing when schedule is null', () => {
      const showNotification = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps({ showNotification })))
      act(() => result.current.saveSchedule())
      expect(showNotification).not.toHaveBeenCalled()
    })
  })

  describe('deleteSchedule', () => {
    it('removes the schedule from localStorage', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.deleteSchedule())
      expect(readAllSchedules()[DATE]).toBeUndefined()
    })

    it('sets schedule to null', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.deleteSchedule())
      expect(result.current.schedule).toBeNull()
    })

    it('calls showNotification with scheduleDeleted message', () => {
      const showNotification = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps({ showNotification })))
      act(() => result.current.deleteSchedule())
      expect(showNotification).toHaveBeenCalledWith(T.scheduleDeleted)
    })
  })

  describe('handleScheduleDragEnd', () => {
    it('reorders schedule items', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() =>
        result.current.handleScheduleDragEnd({ active: { id: 'ta' }, over: { id: 'tb' } })
      )
      expect(result.current.schedule[0].id).toBe('tb')
      expect(result.current.schedule[1].id).toBe('ta')
    })

    it('sets scheduleUnsaved to true after drag', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() =>
        result.current.handleScheduleDragEnd({ active: { id: 'ta' }, over: { id: 'tb' } })
      )
      expect(result.current.scheduleUnsaved).toBe(true)
    })

    it('does nothing when over is null', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleScheduleDragEnd({ active: { id: 'ta' }, over: null }))
      expect(result.current.schedule[0].id).toBe('ta')
      expect(result.current.scheduleUnsaved).toBe(false)
    })

    it('does nothing when dragged onto itself', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() =>
        result.current.handleScheduleDragEnd({ active: { id: 'ta' }, over: { id: 'ta' } })
      )
      expect(result.current.schedule[0].id).toBe('ta')
    })
  })

  describe('handleMarkScheduleItemDone', () => {
    it('marks the schedule item as done', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleMarkScheduleItemDone('ta'))
      expect(result.current.schedule.find((t) => t.id === 'ta').done).toBe(true)
    })

    it('does not affect other schedule items', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleMarkScheduleItemDone('ta'))
      expect(result.current.schedule.find((t) => t.id === 'tb').done).toBe(false)
    })

    it('calls markTaskDone with the dateKey and taskId', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const markTaskDone = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps({ markTaskDone })))
      act(() => result.current.handleMarkScheduleItemDone('ta'))
      expect(markTaskDone).toHaveBeenCalledWith(DATE, 'ta')
    })

    it('does nothing when taskId is not in schedule', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const markTaskDone = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps({ markTaskDone })))
      act(() => result.current.handleMarkScheduleItemDone('nonexistent'))
      expect(markTaskDone).not.toHaveBeenCalled()
    })
  })

  describe('handleRemoveScheduleItem', () => {
    it('removes the item from the schedule', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleRemoveScheduleItem('ta'))
      expect(result.current.schedule).toHaveLength(1)
      expect(result.current.schedule[0].id).toBe('tb')
    })

    it('sets schedule to null when the last item is removed', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleRemoveScheduleItem('ta'))
      expect(result.current.schedule).toBeNull()
    })

    it('sets scheduleUnsaved to true', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.handleRemoveScheduleItem('ta'))
      expect(result.current.scheduleUnsaved).toBe(true)
    })
  })

  describe('markScheduleItemUndone', () => {
    it('sets done to false on a done item', () => {
      writeScheduleForDate(DATE, [{ ...SCHED_A, done: true }, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.markScheduleItemUndone('ta'))
      expect(result.current.schedule.find((t) => t.id === 'ta').done).toBe(false)
    })

    it('does not affect other items', () => {
      writeScheduleForDate(DATE, [{ ...SCHED_A, done: true }, { ...SCHED_B, done: true }])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.markScheduleItemUndone('ta'))
      expect(result.current.schedule.find((t) => t.id === 'tb').done).toBe(true)
    })
  })

  describe('clearSchedule', () => {
    it('sets schedule to null', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.clearSchedule())
      expect(result.current.schedule).toBeNull()
    })

    it('clears all schedules from localStorage', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      writeScheduleForDate(DATE2, [SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.clearSchedule())
      expect(readAllSchedules()).toEqual({})
    })

    it('sets scheduleUnsaved to false', () => {
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A] }))
      )
      act(() => result.current.generateSchedule())
      expect(result.current.scheduleUnsaved).toBe(true)
      act(() => result.current.clearSchedule())
      expect(result.current.scheduleUnsaved).toBe(false)
    })
  })

  describe('checkUnsaved', () => {
    it('calls the callback directly when there is no unsaved schedule', () => {
      const callback = vi.fn()
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.checkUnsaved(callback))
      expect(callback).toHaveBeenCalled()
      expect(result.current.showUnsavedWarning).toBe(false)
    })

    it('shows warning and does not call callback when schedule is unsaved', () => {
      const callback = vi.fn()
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A] }))
      )
      act(() => result.current.generateSchedule())
      act(() => result.current.checkUnsaved(callback))
      expect(callback).not.toHaveBeenCalled()
      expect(result.current.showUnsavedWarning).toBe(true)
    })
  })

  describe('unsaved warning flow', () => {
    const setupWithUnsavedWarning = () => {
      const showNotification = vi.fn()
      const callback = vi.fn()
      const { result } = renderHook(() =>
        useSchedule(makeProps({ tasksForDay: [TASK_A], showNotification }))
      )
      act(() => result.current.generateSchedule())
      act(() => result.current.checkUnsaved(callback))
      return { result, showNotification, callback }
    }

    it('handleUnsavedSaveAndContinue saves, calls proceed, and closes the dialog', () => {
      const { result, showNotification } = setupWithUnsavedWarning()
      act(() => result.current.handleUnsavedSaveAndContinue())
      expect(showNotification).toHaveBeenCalledWith(T.scheduleSaved)
      expect(result.current.showUnsavedWarning).toBe(false)
    })

    it('handleUnsavedDiscard calls proceed without saving and closes the dialog', () => {
      const { result, showNotification, callback } = setupWithUnsavedWarning()
      act(() => result.current.handleUnsavedDiscard())
      expect(showNotification).not.toHaveBeenCalled()
      expect(callback).toHaveBeenCalled()
      expect(result.current.showUnsavedWarning).toBe(false)
    })

    it('handleUnsavedCancel closes the dialog without calling proceed', () => {
      const { result, callback } = setupWithUnsavedWarning()
      act(() => result.current.handleUnsavedCancel())
      expect(callback).not.toHaveBeenCalled()
      expect(result.current.showUnsavedWarning).toBe(false)
    })
  })

  describe('removeTaskFromSchedule', () => {
    it('filters items matching the predicate from in-memory schedule', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.removeTaskFromSchedule((t) => t.id === 'ta'))
      expect(result.current.schedule).toHaveLength(1)
      expect(result.current.schedule[0].id).toBe('tb')
    })

    it('sets schedule to null when all items are filtered out', () => {
      writeScheduleForDate(DATE, [SCHED_A])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.removeTaskFromSchedule((t) => t.id === 'ta'))
      expect(result.current.schedule).toBeNull()
    })

    it('also updates the persisted schedule in localStorage', () => {
      writeScheduleForDate(DATE, [SCHED_A, SCHED_B])
      const { result } = renderHook(() => useSchedule(makeProps()))
      act(() => result.current.removeTaskFromSchedule((t) => t.id === 'ta'))
      const persisted = readAllSchedules()[DATE]
      expect(persisted).toHaveLength(1)
      expect(persisted[0].id).toBe('tb')
    })
  })
})
