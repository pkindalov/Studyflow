import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColumnLayout, DEFAULT_LAYOUT } from './useColumnLayout'

beforeEach(() => {
  localStorage.clear()
})

describe('useColumnLayout', () => {
  describe('initial state', () => {
    it('returns DEFAULT_LAYOUT when nothing is in localStorage', () => {
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.columnLayout).toEqual(DEFAULT_LAYOUT)
    })

    it('loads a saved layout from localStorage', () => {
      const saved = { left: ['activity', 'calendar'], right: ['music', 'quote', 'studyTime', 'priorityPercent', 'todaysTasks'] }
      localStorage.setItem('studyflow_column_layout', JSON.stringify(saved))
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.columnLayout).toEqual(saved)
    })

    it('falls back to DEFAULT_LAYOUT when localStorage contains invalid JSON', () => {
      localStorage.setItem('studyflow_column_layout', 'not-json')
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.columnLayout).toEqual(DEFAULT_LAYOUT)
    })
  })

  describe('missing section backfill', () => {
    it('prepends left-default sections missing from the saved layout', () => {
      // Save a layout that is missing 'calendar' (a DEFAULT_LAYOUT.left section)
      const saved = { left: ['activity'], right: DEFAULT_LAYOUT.right }
      localStorage.setItem('studyflow_column_layout', JSON.stringify(saved))
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.columnLayout.left).toContain('calendar')
    })

    it('appends right-default sections missing from the saved layout', () => {
      // Save a layout that is missing 'music' (a DEFAULT_LAYOUT.right section)
      const rightWithoutMusic = DEFAULT_LAYOUT.right.filter((id) => id !== 'music')
      const saved = { left: DEFAULT_LAYOUT.left, right: rightWithoutMusic }
      localStorage.setItem('studyflow_column_layout', JSON.stringify(saved))
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.columnLayout.right).toContain('music')
    })
  })

  describe('isCustomLayout', () => {
    it('is false when layout equals DEFAULT_LAYOUT', () => {
      const { result } = renderHook(() => useColumnLayout())
      expect(result.current.isCustomLayout).toBe(false)
    })

    it('is true after the layout is changed via setColumnLayout', () => {
      const { result } = renderHook(() => useColumnLayout())
      act(() => result.current.setColumnLayout({ left: ['activity'], right: DEFAULT_LAYOUT.right }))
      expect(result.current.isCustomLayout).toBe(true)
    })
  })

  describe('resetLayout', () => {
    it('restores DEFAULT_LAYOUT', () => {
      const { result } = renderHook(() => useColumnLayout())
      act(() => result.current.setColumnLayout({ left: [], right: [] }))
      act(() => result.current.resetLayout())
      expect(result.current.columnLayout).toEqual(DEFAULT_LAYOUT)
    })

    it('sets isCustomLayout back to false', () => {
      const { result } = renderHook(() => useColumnLayout())
      act(() => result.current.setColumnLayout({ left: [], right: [] }))
      act(() => result.current.resetLayout())
      expect(result.current.isCustomLayout).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    it('writes the current layout to localStorage on change', () => {
      const { result } = renderHook(() => useColumnLayout())
      const custom = { left: ['activity'], right: DEFAULT_LAYOUT.right }
      act(() => result.current.setColumnLayout(custom))
      const stored = JSON.parse(localStorage.getItem('studyflow_column_layout'))
      expect(stored).toEqual(custom)
    })
  })
})
