import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TopBar from './TopBar'

const t = {
  appSettingsToolbar: 'App settings',
  howStudyflowWorks: 'How Studyflow works',
  themePickerAria: 'Choose season theme',
  themeAuto: 'Auto',
  themeSpring: 'Spring',
  themeSummer: 'Summer',
  themeAutumn: 'Autumn',
  themeWinter: 'Winter',
  themeAutoHint: (season) => `Auto — currently ${season}`,
}

let onShowHelp, setLang, setThemeChoice

beforeEach(() => {
  onShowHelp = vi.fn()
  setLang = vi.fn()
  setThemeChoice = vi.fn()
})

const renderTopBar = (props = {}) =>
  render(
    <TopBar
      onShowHelp={onShowHelp}
      lang="en"
      setLang={setLang}
      themeChoice="auto"
      setThemeChoice={setThemeChoice}
      activeSeason="summer"
      t={t}
      {...props}
    />
  )

// ── help button ───────────────────────────────────────────────────────────────

describe('help button', () => {
  it('calls onShowHelp when clicked', () => {
    renderTopBar()
    fireEvent.click(screen.getAllByRole('button', { name: 'How Studyflow works' })[0])
    expect(onShowHelp).toHaveBeenCalled()
  })
})

// ── language switcher ─────────────────────────────────────────────────────────

describe('language switcher', () => {
  it('calls setLang("en") when EN button is clicked', () => {
    renderTopBar({ lang: 'bg' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to English' })[0])
    expect(setLang).toHaveBeenCalledWith('en')
  })

  it('calls setLang("bg") when БГ button is clicked', () => {
    renderTopBar({ lang: 'en' })
    fireEvent.click(screen.getAllByRole('button', { name: 'Switch to Bulgarian' })[0])
    expect(setLang).toHaveBeenCalledWith('bg')
  })

  it('EN button has active class when lang is "en"', () => {
    renderTopBar({ lang: 'en' })
    expect(screen.getAllByRole('button', { name: 'Switch to English' })[0].className).toContain('bg-primary')
  })

  it('БГ button has active class when lang is "bg"', () => {
    renderTopBar({ lang: 'bg' })
    expect(screen.getAllByRole('button', { name: 'Switch to Bulgarian' })[0].className).toContain('bg-primary')
  })
})

// ── season theme picker ───────────────────────────────────────────────────────

describe('season theme picker', () => {
  it('shows the Auto label with the resolved season when themeChoice is auto', () => {
    renderTopBar({ themeChoice: 'auto', activeSeason: 'winter' })
    expect(screen.getAllByRole('button', { name: /auto — currently winter/i }).length).toBeGreaterThan(0)
  })

  it('shows the season label when a specific season is chosen', () => {
    renderTopBar({ themeChoice: 'autumn', activeSeason: 'autumn' })
    expect(screen.getAllByRole('button', { name: 'Autumn' }).length).toBeGreaterThan(0)
  })

  it('calls setThemeChoice with the picked season when a menu option is clicked', () => {
    renderTopBar()
    fireEvent.click(screen.getAllByRole('button', { name: /auto — currently summer/i })[0])
    fireEvent.click(screen.getAllByRole('menuitem', { name: /^spring$/i })[0])
    expect(setThemeChoice).toHaveBeenCalledWith('spring')
  })
})
