import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskActions } from './useTaskActions'

const DATE = '2024-01-15'

const TASK = { id: 'ta', text: 'Math', priority: false, done: false }
const RECURRING_TASK = { ...TASK, recurringId: 'rec-1' }

const makeProps = (overrides = {}) => ({
  tasks: { [DATE]: [TASK] },
  dateKey: DATE,
  deleteTask: vi.fn(),
  deleteRecurring: vi.fn(),
  deleteAllByRecurringId: vi.fn(),
  removeTaskFromSchedule: vi.fn(),
  reorderTasks: vi.fn(),
  taskBank: [],
  savedListTexts: new Set(),
  addToBank: vi.fn(),
  removeFromBank: vi.fn(),
  showNotification: vi.fn(),
  t: { saveToList: 'Saved to list' },
  setShowTaskBankModal: vi.fn(),
  setTaskBankModalAutoGenerate: vi.fn(),
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTaskActions', () => {
  describe('handleDeleteTask — non-recurring', () => {
    it('calls deleteTask with dateKey and id', () => {
      const deleteTask = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ deleteTask })))
      act(() => result.current.handleDeleteTask('ta'))
      expect(deleteTask).toHaveBeenCalledWith(DATE, 'ta')
    })

    it('removes task from schedule by id', () => {
      const removeTaskFromSchedule = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ removeTaskFromSchedule })))
      act(() => result.current.handleDeleteTask('ta'))
      const predicate = removeTaskFromSchedule.mock.calls[0][0]
      expect(predicate({ id: 'ta' })).toBe(true)
      expect(predicate({ id: 'tb' })).toBe(false)
    })

    it('does not call deleteRecurring for a non-recurring task', () => {
      const deleteRecurring = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ deleteRecurring })))
      act(() => result.current.handleDeleteTask('ta'))
      expect(deleteRecurring).not.toHaveBeenCalled()
    })
  })

  describe('handleDeleteTask — recurring', () => {
    const recurringProps = (extra = {}) =>
      makeProps({ tasks: { [DATE]: [RECURRING_TASK] }, ...extra })

    it('calls deleteRecurring with the recurringId', () => {
      const deleteRecurring = vi.fn()
      const { result } = renderHook(() => useTaskActions(recurringProps({ deleteRecurring })))
      act(() => result.current.handleDeleteTask('ta'))
      expect(deleteRecurring).toHaveBeenCalledWith('rec-1')
    })

    it('calls deleteAllByRecurringId', () => {
      const deleteAllByRecurringId = vi.fn()
      const { result } = renderHook(() => useTaskActions(recurringProps({ deleteAllByRecurringId })))
      act(() => result.current.handleDeleteTask('ta'))
      expect(deleteAllByRecurringId).toHaveBeenCalledWith('rec-1')
    })

    it('removes tasks from schedule by recurringId', () => {
      const removeTaskFromSchedule = vi.fn()
      const { result } = renderHook(() => useTaskActions(recurringProps({ removeTaskFromSchedule })))
      act(() => result.current.handleDeleteTask('ta'))
      const predicate = removeTaskFromSchedule.mock.calls[0][0]
      expect(predicate({ recurringId: 'rec-1' })).toBe(true)
      expect(predicate({ recurringId: 'rec-2' })).toBe(false)
    })

    it('does not call deleteTask for a recurring task', () => {
      const deleteTask = vi.fn()
      const { result } = renderHook(() => useTaskActions(recurringProps({ deleteTask })))
      act(() => result.current.handleDeleteTask('ta'))
      expect(deleteTask).not.toHaveBeenCalled()
    })
  })

  describe('handleStopRecurring', () => {
    it('deletes the recurring template', () => {
      const deleteRecurring = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ deleteRecurring })))
      act(() => result.current.handleStopRecurring('rec-1'))
      expect(deleteRecurring).toHaveBeenCalledWith('rec-1')
    })

    it('deletes all task instances', () => {
      const deleteAllByRecurringId = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ deleteAllByRecurringId })))
      act(() => result.current.handleStopRecurring('rec-1'))
      expect(deleteAllByRecurringId).toHaveBeenCalledWith('rec-1')
    })
  })

  describe('handleSaveToBank', () => {
    it('adds to bank when text is not yet saved', () => {
      const addToBank = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ addToBank })))
      act(() => result.current.handleSaveToBank(TASK))
      expect(addToBank).toHaveBeenCalledWith(TASK.text, TASK.priority)
    })

    it('shows notification when adding', () => {
      const showNotification = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ showNotification })))
      act(() => result.current.handleSaveToBank(TASK))
      expect(showNotification).toHaveBeenCalledWith('Saved to list')
    })

    it('removes from bank when text is already saved', () => {
      const removeFromBank = vi.fn()
      const bankTask = { id: 'bk-1', text: 'Math' }
      const { result } = renderHook(() =>
        useTaskActions(makeProps({
          removeFromBank,
          savedListTexts: new Set(['Math']),
          taskBank: [bankTask],
        }))
      )
      act(() => result.current.handleSaveToBank(TASK))
      expect(removeFromBank).toHaveBeenCalledWith('bk-1')
    })

    it('does not call addToBank when removing', () => {
      const addToBank = vi.fn()
      const { result } = renderHook(() =>
        useTaskActions(makeProps({
          addToBank,
          savedListTexts: new Set(['Math']),
          taskBank: [{ id: 'bk-1', text: 'Math' }],
        }))
      )
      act(() => result.current.handleSaveToBank(TASK))
      expect(addToBank).not.toHaveBeenCalled()
    })

    it('does not call removeFromBank when text is not saved', () => {
      const removeFromBank = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ removeFromBank })))
      act(() => result.current.handleSaveToBank(TASK))
      expect(removeFromBank).not.toHaveBeenCalled()
    })
  })

  describe('handleOpenSavedList', () => {
    it('disables auto-generate and opens the modal', () => {
      const setTaskBankModalAutoGenerate = vi.fn()
      const setShowTaskBankModal = vi.fn()
      const { result } = renderHook(() =>
        useTaskActions(makeProps({ setTaskBankModalAutoGenerate, setShowTaskBankModal }))
      )
      act(() => result.current.handleOpenSavedList())
      expect(setTaskBankModalAutoGenerate).toHaveBeenCalledWith(false)
      expect(setShowTaskBankModal).toHaveBeenCalledWith(true)
    })
  })

  describe('handleReorder', () => {
    it('delegates to reorderTasks with dateKey, draggedId, and targetId', () => {
      const reorderTasks = vi.fn()
      const { result } = renderHook(() => useTaskActions(makeProps({ reorderTasks })))
      act(() => result.current.handleReorder('ta', 'tb'))
      expect(reorderTasks).toHaveBeenCalledWith(DATE, 'ta', 'tb')
    })
  })
})
