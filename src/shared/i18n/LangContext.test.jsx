import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LangProvider, useLang } from './LangContext'
import { en } from './en.jsx'
import { bg } from './bg.jsx'

const wrapper = ({ children }) => <LangProvider>{children}</LangProvider>

beforeEach(() => {
  localStorage.clear()
})

// ── initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('defaults lang to "en" when localStorage is empty', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.lang).toBe('en')
  })

  it('hydrates lang from localStorage', () => {
    localStorage.setItem('studyflow_lang', 'bg')
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.lang).toBe('bg')
  })

  it('t is the en translations object by default', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.t).toBe(en)
  })

  it('t is the bg translations object when lang is bg', () => {
    localStorage.setItem('studyflow_lang', 'bg')
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(result.current.t).toBe(bg)
  })

  it('exposes a setLang function', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    expect(typeof result.current.setLang).toBe('function')
  })
})

// ── setLang ───────────────────────────────────────────────────────────────────

describe('setLang', () => {
  it('switches lang state to bg', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    act(() => result.current.setLang('bg'))
    expect(result.current.lang).toBe('bg')
  })

  it('switches t to bg translations', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    act(() => result.current.setLang('bg'))
    expect(result.current.t).toBe(bg)
  })

  it('persists the chosen lang to localStorage', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    act(() => result.current.setLang('bg'))
    expect(localStorage.getItem('studyflow_lang')).toBe('bg')
  })

  it('can switch back from bg to en', () => {
    localStorage.setItem('studyflow_lang', 'bg')
    const { result } = renderHook(() => useLang(), { wrapper })
    act(() => result.current.setLang('en'))
    expect(result.current.lang).toBe('en')
    expect(result.current.t).toBe(en)
  })

  it('falls back to en translations for an unknown lang code', () => {
    const { result } = renderHook(() => useLang(), { wrapper })
    act(() => result.current.setLang('xx'))
    expect(result.current.t).toBe(en)
  })
})

// ── translation content sanity ────────────────────────────────────────────────

describe('translation content', () => {
  it('en and bg have different appTagline values', () => {
    expect(en.appTagline).not.toBe(bg.appTagline)
  })

  it('both languages share the appName "Studyflow"', () => {
    expect(en.appName).toBe('Studyflow')
    expect(bg.appName).toBe('Studyflow')
  })
})
