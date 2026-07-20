import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme } from './ThemeContext'

const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.useRealTimers()
})

// ── initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('defaults themeChoice to "auto" when localStorage is empty', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeChoice).toBe('auto')
  })

  it('hydrates themeChoice from localStorage', () => {
    localStorage.setItem('studyflow_theme', 'summer')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeChoice).toBe('summer')
  })

  it('falls back to "auto" for a legacy "dark" value from the old light/dark toggle', () => {
    localStorage.setItem('studyflow_theme', 'dark')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeChoice).toBe('auto')
  })

  it('falls back to "auto" for a legacy "light" value from the old light/dark toggle', () => {
    localStorage.setItem('studyflow_theme', 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeChoice).toBe('auto')
  })

  it('falls back to "auto" for any other unrecognized value', () => {
    localStorage.setItem('studyflow_theme', 'garbage')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.themeChoice).toBe('auto')
  })

  it('exposes a setThemeChoice function', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(typeof result.current.setThemeChoice).toBe('function')
  })
})

// ── auto season resolution ───────────────────────────────────────────────────

describe('activeSeason when themeChoice is "auto"', () => {
  it('resolves to the season matching the current date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 20)) // July 20 → summer
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.activeSeason).toBe('summer')
  })

  it('sets the data-theme attribute to the resolved season', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 5)) // October 5 → autumn
    renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement.getAttribute('data-theme')).toBe('autumn')
  })
})

describe('activeSeason when themeChoice is a specific season', () => {
  it('uses the chosen season regardless of the current date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 20)) // July → summer, but user picked winter
    localStorage.setItem('studyflow_theme', 'winter')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.activeSeason).toBe('winter')
    expect(document.documentElement.getAttribute('data-theme')).toBe('winter')
  })
})

// ── setThemeChoice ────────────────────────────────────────────────────────────

describe('setThemeChoice', () => {
  it('switches themeChoice state', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setThemeChoice('spring'))
    expect(result.current.themeChoice).toBe('spring')
  })

  it('updates activeSeason and the data-theme attribute', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setThemeChoice('autumn'))
    expect(result.current.activeSeason).toBe('autumn')
    expect(document.documentElement.getAttribute('data-theme')).toBe('autumn')
  })

  it('persists the chosen theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setThemeChoice('spring'))
    expect(localStorage.getItem('studyflow_theme')).toBe('spring')
  })

  it('survives "refresh" — a new provider instance re-hydrates the saved choice', () => {
    const first = renderHook(() => useTheme(), { wrapper })
    act(() => first.result.current.setThemeChoice('summer'))
    first.unmount()

    const second = renderHook(() => useTheme(), { wrapper })
    expect(second.result.current.themeChoice).toBe('summer')
  })

  it('can switch back to "auto"', () => {
    localStorage.setItem('studyflow_theme', 'winter')
    const { result } = renderHook(() => useTheme(), { wrapper })
    act(() => result.current.setThemeChoice('auto'))
    expect(result.current.themeChoice).toBe('auto')
    expect(localStorage.getItem('studyflow_theme')).toBe('auto')
  })
})
