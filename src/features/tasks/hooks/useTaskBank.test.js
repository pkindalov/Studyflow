import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskBank } from './useTaskBank'

beforeEach(() => {
  localStorage.clear()
})

describe('useTaskBank', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useTaskBank())
    expect(result.current.taskBank).toEqual([])
  })

  describe('addToBank', () => {
    it('adds a new item', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Read a chapter'))
      expect(result.current.taskBank).toHaveLength(1)
      expect(result.current.taskBank[0].text).toBe('Read a chapter')
    })

    it('trims whitespace from text', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('  Study  '))
      expect(result.current.taskBank[0].text).toBe('Study')
    })

    it('ignores empty string', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank(''))
      expect(result.current.taskBank).toHaveLength(0)
    })

    it('ignores whitespace-only string', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('   '))
      expect(result.current.taskBank).toHaveLength(0)
    })

    it('deduplicates exact text + priority matches', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Read', false))
      act(() => result.current.addToBank('Read', false))
      expect(result.current.taskBank).toHaveLength(1)
    })

    it('allows same text with different priority', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Read', false))
      act(() => result.current.addToBank('Read', true))
      expect(result.current.taskBank).toHaveLength(2)
    })

    it('assigns a unique id to each item', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => {
        result.current.addToBank('A')
        result.current.addToBank('B')
      })
      const [a, b] = result.current.taskBank
      expect(a.id).not.toBe(b.id)
    })
  })

  describe('removeFromBank', () => {
    it('removes the item with the given id', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Study'))
      const id = result.current.taskBank[0].id
      act(() => result.current.removeFromBank(id))
      expect(result.current.taskBank).toHaveLength(0)
    })

    it('does not affect other items', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => {
        result.current.addToBank('A')
        result.current.addToBank('B')
      })
      const idA = result.current.taskBank[0].id
      act(() => result.current.removeFromBank(idA))
      expect(result.current.taskBank[0].text).toBe('B')
    })
  })

  describe('updateInBank', () => {
    it('updates text and priority', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Old text', false))
      const id = result.current.taskBank[0].id
      act(() => result.current.updateInBank(id, 'New text', true))
      expect(result.current.taskBank[0].text).toBe('New text')
      expect(result.current.taskBank[0].priority).toBe(true)
    })

    it('ignores update when new text is empty', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Keep me'))
      const id = result.current.taskBank[0].id
      act(() => result.current.updateInBank(id, '  ', false))
      expect(result.current.taskBank[0].text).toBe('Keep me')
    })

    it('trims whitespace from the new text', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('Old'))
      const id = result.current.taskBank[0].id
      act(() => result.current.updateInBank(id, '  Trimmed  ', false))
      expect(result.current.taskBank[0].text).toBe('Trimmed')
    })
  })

  describe('reorderBank', () => {
    it('moves an item from one position to another', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => {
        result.current.addToBank('A')
        result.current.addToBank('B')
        result.current.addToBank('C')
      })
      const [idA, , idC] = result.current.taskBank.map((t) => t.id)
      act(() => result.current.reorderBank(idA, idC))
      expect(result.current.taskBank.map((t) => t.text)).toEqual(['B', 'C', 'A'])
    })

    it('does nothing when from and to are the same', () => {
      const { result } = renderHook(() => useTaskBank())
      act(() => result.current.addToBank('A'))
      const id = result.current.taskBank[0].id
      act(() => result.current.reorderBank(id, id))
      expect(result.current.taskBank).toHaveLength(1)
    })
  })

  describe('localStorage persistence', () => {
    it('loads items saved by a previous session', () => {
      const saved = [{ id: 'z1', text: 'Saved item', priority: false }]
      localStorage.setItem('studyflow_task_bank', JSON.stringify(saved))
      const { result } = renderHook(() => useTaskBank())
      expect(result.current.taskBank[0].text).toBe('Saved item')
    })
  })
})
