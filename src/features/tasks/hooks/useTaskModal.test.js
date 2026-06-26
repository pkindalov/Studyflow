import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskModal } from './useTaskModal'

const DATE = '2024-01-15'
const DATE2 = '2024-01-20'

const TASK = { id: 'ta', text: 'Math', priority: false, done: false, imageUrl: '' }
const RECURRING_TASK = { ...TASK, recurringId: 'rec-1' }
const RECURRING_TPL = { id: 'rec-1', recurrence: 'daily', startDate: '2024-01-01', endDate: '2024-03-31' }

const makeProps = (overrides = {}) => ({
  mode: 'add',
  dateKey: DATE,
  tasks: { [DATE]: [TASK] },
  recurringTasks: [],
  addTask: vi.fn(),
  addRecurring: vi.fn().mockReturnValue('new-rec-id'),
  editTask: vi.fn(),
  moveTask: vi.fn(),
  updateRecurring: vi.fn(),
  linkRecurring: vi.fn(),
  deleteRecurring: vi.fn(),
  deleteAllByRecurringId: vi.fn(),
  removeTaskFromSchedule: vi.fn(),
  setScheduleTimers: vi.fn(),
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('useTaskModal', () => {
  describe('initial state', () => {
    it('starts closed with empty text', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      expect(result.current.isOpen).toBe(false)
      expect(result.current.text).toBe('')
    })

    it('starts with recurrence none, dateMode single, and priority false', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      expect(result.current.recurrence).toBe('none')
      expect(result.current.dateMode).toBe('single')
      expect(result.current.priority).toBe(false)
    })
  })

  describe('open — add mode', () => {
    it('opens the modal', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => result.current.open())
      expect(result.current.isOpen).toBe(true)
    })

    it('sets startDate when arg provides one', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => result.current.open({ startDate: DATE2 }))
      expect(result.current.startDate).toBe(DATE2)
    })

    it('defaults startDate to dateKey when no arg is given', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => result.current.open())
      expect(result.current.startDate).toBe(DATE)
    })
  })

  describe('open — edit mode, non-recurring task', () => {
    it('populates text, image, and priority from the task', () => {
      const task = { ...TASK, text: 'Physics', imageUrl: 'img.png', priority: true }
      const { result } = renderHook(() => useTaskModal(makeProps({ mode: 'edit' })))
      act(() => result.current.open(task))
      expect(result.current.text).toBe('Physics')
      expect(result.current.image).toBe('img.png')
      expect(result.current.priority).toBe(true)
    })

    it('sets targetDate to dateKey and isRecurringInstance to false', () => {
      const { result } = renderHook(() => useTaskModal(makeProps({ mode: 'edit' })))
      act(() => result.current.open(TASK))
      expect(result.current.targetDate).toBe(DATE)
      expect(result.current.isRecurringInstance).toBe(false)
    })

    it('sets recurrence to none', () => {
      const { result } = renderHook(() => useTaskModal(makeProps({ mode: 'edit' })))
      act(() => result.current.open(TASK))
      expect(result.current.recurrence).toBe('none')
    })
  })

  describe('open — edit mode, recurring task', () => {
    const recurringEditProps = () =>
      makeProps({ mode: 'edit', tasks: { [DATE]: [RECURRING_TASK] }, recurringTasks: [RECURRING_TPL] })

    it('loads recurrence, startDate, and endDate from the template', () => {
      const { result } = renderHook(() => useTaskModal(recurringEditProps()))
      act(() => result.current.open(RECURRING_TASK))
      expect(result.current.recurrence).toBe('daily')
      expect(result.current.startDate).toBe('2024-01-01')
      expect(result.current.endDate).toBe('2024-03-31')
    })

    it('sets isRecurringInstance to true and clears targetDate', () => {
      const { result } = renderHook(() => useTaskModal(recurringEditProps()))
      act(() => result.current.open(RECURRING_TASK))
      expect(result.current.isRecurringInstance).toBe(true)
      expect(result.current.targetDate).toBe('')
    })
  })

  describe('reset', () => {
    it('closes the modal and clears all fields', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => {
        result.current.open({ startDate: DATE2 })
        result.current.setText('Something')
        result.current.setPriority(true)
      })
      act(() => result.current.reset())
      expect(result.current.isOpen).toBe(false)
      expect(result.current.text).toBe('')
      expect(result.current.startDate).toBe('')
      expect(result.current.priority).toBe(false)
      expect(result.current.recurrence).toBe('none')
    })
  })

  describe('handleSetRecurrence', () => {
    it('sets the recurrence value', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => result.current.handleSetRecurrence('monthly'))
      expect(result.current.recurrence).toBe('monthly')
    })

    it('preserves dates when switching between frequencies', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => {
        result.current.setStartDate(DATE)
        result.current.setEndDate('2024-12-31')
        result.current.handleSetRecurrence('daily')
      })
      act(() => result.current.handleSetRecurrence('monthly'))
      expect(result.current.startDate).toBe(DATE)
      expect(result.current.endDate).toBe('2024-12-31')
    })
  })

  describe('handleSetDateMode', () => {
    it('clears endDate when switching to single', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => {
        result.current.setEndDate('2024-12-31')
        result.current.handleSetDateMode('single')
      })
      expect(result.current.endDate).toBe('')
    })

    it('preserves endDate when switching to range', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => {
        result.current.setEndDate('2024-12-31')
        result.current.handleSetDateMode('range')
      })
      expect(result.current.endDate).toBe('2024-12-31')
    })

    it('sets dateMode to range', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => result.current.handleSetDateMode('range'))
      expect(result.current.dateMode).toBe('range')
    })
  })

  describe('handleSubmit — add mode, no recurrence', () => {
    it('calls addTask with dateKey, text, image, and priority', () => {
      const addTask = vi.fn()
      const { result } = renderHook(() => useTaskModal(makeProps({ addTask })))
      act(() => {
        result.current.setText('Study')
        result.current.setPriority(true)
      })
      act(() => result.current.handleSubmit())
      expect(addTask).toHaveBeenCalledWith(DATE, 'Study', '', true)
    })

    it('resets the modal after submit', () => {
      const { result } = renderHook(() => useTaskModal(makeProps()))
      act(() => {
        result.current.open()
        result.current.setText('Study')
      })
      act(() => result.current.handleSubmit())
      expect(result.current.isOpen).toBe(false)
      expect(result.current.text).toBe('')
    })
  })

  describe('handleSubmit — add mode, with recurrence', () => {
    it('calls addRecurring instead of addTask', () => {
      const addTask = vi.fn()
      const addRecurring = vi.fn().mockReturnValue('rid')
      const { result } = renderHook(() => useTaskModal(makeProps({ addTask, addRecurring })))
      act(() => {
        result.current.setText('Daily habit')
        result.current.setRecurrence('daily')
        result.current.setStartDate(DATE)
      })
      act(() => result.current.handleSubmit())
      expect(addRecurring).toHaveBeenCalled()
      expect(addTask).not.toHaveBeenCalled()
    })

    it('passes the selected recurrence directly to addRecurring for standard types', () => {
      const addRecurring = vi.fn().mockReturnValue('rid')
      const { result } = renderHook(() => useTaskModal(makeProps({ addRecurring })))
      act(() => {
        result.current.setText('Habit')
        result.current.setRecurrence('monthly')
        result.current.setStartDate(DATE)
      })
      act(() => result.current.handleSubmit())
      expect(addRecurring.mock.calls[0][3]).toBe('monthly')
    })

    it('uses "daily" when dateMode is "range" and recurrence is "none"', () => {
      const addRecurring = vi.fn().mockReturnValue('rid')
      const { result } = renderHook(() => useTaskModal(makeProps({ addRecurring })))
      act(() => {
        result.current.setText('Habit')
        result.current.handleSetDateMode('range')
        result.current.setStartDate(DATE)
        result.current.setEndDate('2024-06-30')
      })
      act(() => result.current.handleSubmit())
      expect(addRecurring.mock.calls[0][3]).toBe('daily')
    })
  })

  describe('handleSubmit — edit mode, simple edit', () => {
    it('calls editTask with updated fields', () => {
      const editTask = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({ mode: 'edit', editTask }))
      )
      act(() => result.current.open(TASK))
      act(() => {
        result.current.setText('Updated')
        result.current.setPriority(true)
      })
      act(() => result.current.handleSubmit())
      expect(editTask).toHaveBeenCalledWith(DATE, 'ta', 'Updated', '', true)
    })

    it('does not call moveTask when targetDate equals dateKey', () => {
      const moveTask = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({ mode: 'edit', moveTask }))
      )
      act(() => result.current.open(TASK))
      act(() => result.current.handleSubmit())
      expect(moveTask).not.toHaveBeenCalled()
    })

    it('resets the modal after submit', () => {
      const { result } = renderHook(() => useTaskModal(makeProps({ mode: 'edit' })))
      act(() => result.current.open(TASK))
      act(() => result.current.handleSubmit())
      expect(result.current.isOpen).toBe(false)
      expect(result.current.text).toBe('')
    })
  })

  describe('handleSubmit — edit mode, with date change', () => {
    it('calls moveTask when targetDate differs from dateKey', () => {
      const moveTask = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({ mode: 'edit', moveTask }))
      )
      act(() => result.current.open(TASK))
      act(() => result.current.setTargetDate(DATE2))
      act(() => result.current.handleSubmit())
      expect(moveTask).toHaveBeenCalledWith(DATE, DATE2, 'ta')
    })

    it('removes task from schedule when moving dates', () => {
      const removeTaskFromSchedule = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({ mode: 'edit', removeTaskFromSchedule }))
      )
      act(() => result.current.open(TASK))
      act(() => result.current.setTargetDate(DATE2))
      act(() => result.current.handleSubmit())
      expect(removeTaskFromSchedule).toHaveBeenCalled()
    })
  })

  describe('handleSubmit — edit mode, promote to recurring', () => {
    it('calls addRecurring and links the new id to the task', () => {
      const addRecurring = vi.fn().mockReturnValue('new-rec-id')
      const linkRecurring = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({ mode: 'edit', addRecurring, linkRecurring }))
      )
      act(() => result.current.open(TASK))
      act(() => result.current.setRecurrence('weekly'))
      act(() => result.current.handleSubmit())
      expect(addRecurring).toHaveBeenCalled()
      expect(linkRecurring).toHaveBeenCalledWith(DATE, 'ta', 'new-rec-id')
    })
  })

  describe('handleSubmit — edit mode, update existing recurring', () => {
    it('calls updateRecurring when the task already has a recurringId', () => {
      const updateRecurring = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({
          mode: 'edit',
          tasks: { [DATE]: [RECURRING_TASK] },
          recurringTasks: [RECURRING_TPL],
          updateRecurring,
        }))
      )
      act(() => result.current.open(RECURRING_TASK))
      act(() => result.current.handleSubmit())
      expect(updateRecurring).toHaveBeenCalledWith('rec-1', expect.any(String), expect.any(String), expect.any(Boolean), 'daily', expect.any(String), expect.any(String))
    })
  })

  describe('handleSubmit — edit mode, strip recurrence', () => {
    it('deletes the recurring template and unlinks the task', () => {
      const deleteRecurring = vi.fn()
      const deleteAllByRecurringId = vi.fn()
      const linkRecurring = vi.fn()
      const { result } = renderHook(() =>
        useTaskModal(makeProps({
          mode: 'edit',
          tasks: { [DATE]: [RECURRING_TASK] },
          recurringTasks: [RECURRING_TPL],
          deleteRecurring,
          deleteAllByRecurringId,
          linkRecurring,
        }))
      )
      act(() => result.current.open(RECURRING_TASK))
      act(() => result.current.setRecurrence('none'))
      act(() => result.current.handleSubmit())
      expect(deleteRecurring).toHaveBeenCalledWith('rec-1')
      expect(deleteAllByRecurringId).toHaveBeenCalledWith('rec-1')
      expect(linkRecurring).toHaveBeenCalledWith(DATE, 'ta', null)
    })
  })
})
