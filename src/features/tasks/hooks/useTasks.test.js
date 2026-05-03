import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'

const DATE = '2024-01-01'
const DATE2 = '2024-01-02'

beforeEach(() => {
  localStorage.clear()
})

describe('useTasks', () => {
  it('starts with an empty task map', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toEqual({})
  })

  describe('addTask', () => {
    it('adds a task under the given dateKey', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Read a book'))
      expect(result.current.tasks[DATE]).toHaveLength(1)
      expect(result.current.tasks[DATE][0].text).toBe('Read a book')
    })

    it('new task is not done by default', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Read a book'))
      expect(result.current.tasks[DATE][0].done).toBe(false)
    })

    it('accumulates multiple tasks on the same date', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'Task A')
        result.current.addTask(DATE, 'Task B')
      })
      expect(result.current.tasks[DATE]).toHaveLength(2)
    })
  })

  describe('addTaskDirect', () => {
    it('inserts a pre-built task object', () => {
      const { result } = renderHook(() => useTasks())
      const task = { id: 'x1', text: 'Direct', done: false, priority: true }
      act(() => result.current.addTaskDirect(DATE, task))
      expect(result.current.tasks[DATE][0]).toMatchObject(task)
    })
  })

  describe('toggleTask', () => {
    it('marks an undone task as done', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.toggleTask(DATE, id))
      expect(result.current.tasks[DATE][0].done).toBe(true)
    })

    it('marks a done task as undone', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.toggleTask(DATE, id))
      act(() => result.current.toggleTask(DATE, id))
      expect(result.current.tasks[DATE][0].done).toBe(false)
    })

    it('does not affect other tasks', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'A')
        result.current.addTask(DATE, 'B')
      })
      const idA = result.current.tasks[DATE][0].id
      act(() => result.current.toggleTask(DATE, idA))
      expect(result.current.tasks[DATE][1].done).toBe(false)
    })
  })

  describe('markTaskDone', () => {
    it('sets done to true regardless of current state', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.markTaskDone(DATE, id))
      expect(result.current.tasks[DATE][0].done).toBe(true)
    })

    it('is idempotent when called twice', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.markTaskDone(DATE, id))
      act(() => result.current.markTaskDone(DATE, id))
      expect(result.current.tasks[DATE][0].done).toBe(true)
    })
  })

  describe('deleteTask', () => {
    it('removes the task from the list', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.deleteTask(DATE, id))
      expect(result.current.tasks[DATE]).toHaveLength(0)
    })

    it('does not affect other tasks', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'A')
        result.current.addTask(DATE, 'B')
      })
      const idA = result.current.tasks[DATE][0].id
      act(() => result.current.deleteTask(DATE, idA))
      expect(result.current.tasks[DATE][0].text).toBe('B')
    })
  })

  describe('editTask', () => {
    it('updates text, imageUrl, and priority', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Old'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.editTask(DATE, id, 'New', 'img.png', true))
      const task = result.current.tasks[DATE][0]
      expect(task.text).toBe('New')
      expect(task.imageUrl).toBe('img.png')
      expect(task.priority).toBe(true)
    })
  })

  describe('linkRecurring', () => {
    it('attaches a recurringId to a task', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Daily habit'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.linkRecurring(DATE, id, 'rec-99'))
      expect(result.current.tasks[DATE][0].recurringId).toBe('rec-99')
    })
  })

  describe('deleteAllByRecurringId', () => {
    it('removes tasks with the given recurringId across all dates', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTaskDirect(DATE, { id: 'a', text: 'A', done: false, recurringId: 'rec-1' })
        result.current.addTaskDirect(DATE2, { id: 'b', text: 'B', done: false, recurringId: 'rec-1' })
        result.current.addTaskDirect(DATE, { id: 'c', text: 'C', done: false, recurringId: 'rec-2' })
      })
      act(() => result.current.deleteAllByRecurringId('rec-1'))
      expect(result.current.tasks[DATE].map((t) => t.id)).not.toContain('a')
      expect(result.current.tasks[DATE2]).toHaveLength(0)
      expect(result.current.tasks[DATE].map((t) => t.id)).toContain('c')
    })
  })

  describe('moveTask', () => {
    it('moves a task to a different date', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.moveTask(DATE, DATE2, id))
      expect(result.current.tasks[DATE]).toHaveLength(0)
      expect(result.current.tasks[DATE2]).toHaveLength(1)
    })

    it('resets done to false on the moved task', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.markTaskDone(DATE, id))
      act(() => result.current.moveTask(DATE, DATE2, id))
      expect(result.current.tasks[DATE2][0].done).toBe(false)
    })

    it('does nothing when taskId does not exist', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'Study'))
      act(() => result.current.moveTask(DATE, DATE2, 'nonexistent'))
      expect(result.current.tasks[DATE]).toHaveLength(1)
    })

    it('appends to existing tasks on the destination date', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'Source task')
        result.current.addTask(DATE2, 'Existing on target')
      })
      const sourceId = result.current.tasks[DATE][0].id
      act(() => result.current.moveTask(DATE, DATE2, sourceId))
      expect(result.current.tasks[DATE2]).toHaveLength(2)
      expect(result.current.tasks[DATE2][1].text).toBe('Source task')
    })
  })

  describe('reorderTasks', () => {
    it('moves a task from one position to another', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'A')
        result.current.addTask(DATE, 'B')
        result.current.addTask(DATE, 'C')
      })
      const [idA, , idC] = result.current.tasks[DATE].map((t) => t.id)
      act(() => result.current.reorderTasks(DATE, idA, idC))
      expect(result.current.tasks[DATE].map((t) => t.text)).toEqual(['B', 'C', 'A'])
    })

    it('does nothing when source and target are the same', () => {
      const { result } = renderHook(() => useTasks())
      act(() => result.current.addTask(DATE, 'A'))
      const id = result.current.tasks[DATE][0].id
      act(() => result.current.reorderTasks(DATE, id, id))
      expect(result.current.tasks[DATE]).toHaveLength(1)
    })
  })

  describe('clearAllTasks', () => {
    it('empties the entire task map', () => {
      const { result } = renderHook(() => useTasks())
      act(() => {
        result.current.addTask(DATE, 'A')
        result.current.addTask(DATE2, 'B')
      })
      act(() => result.current.clearAllTasks())
      expect(result.current.tasks).toEqual({})
    })
  })

  describe('localStorage persistence', () => {
    it('loads tasks saved by a previous session', () => {
      const saved = { [DATE]: [{ id: 'z1', text: 'Saved', done: false }] }
      localStorage.setItem('studyflow_tasks', JSON.stringify(saved))
      const { result } = renderHook(() => useTasks())
      expect(result.current.tasks[DATE][0].text).toBe('Saved')
    })
  })
})
