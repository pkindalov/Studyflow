import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TopBar from './TopBar'

const t = {
  howStudyflowWorks: 'How Studyflow works',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',
  lightMode: 'Light',
  darkMode: 'Dark',
}

let onShowHelp, setLang, setTheme

beforeEach(() => {
  onShowHelp = vi.fn()
  setLang = vi.fn()
  setTheme = vi.fn()
})

// ── help button ───────────────────────────────────────────────────────────────

describe('help button', () => {
  it('calls onShowHelp when clicked', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Help' })[0])
    expect(onShowHelp).toHaveBeenCalled()
  })
})

// ── language switcher ─────────────────────────────────────────────────────────

describe('language switcher', () => {
  it('calls setLang("en") when EN button is clicked', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="bg" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'EN' })[0])
    expect(setLang).toHaveBeenCalledWith('en')
  })

  it('calls setLang("bg") when БГ button is clicked', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'БГ' })[0])
    expect(setLang).toHaveBeenCalledWith('bg')
  })

  it('EN button has active class when lang is "en"', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    expect(screen.getAllByRole('button', { name: 'EN' })[0].className).toContain('bg-primary')
  })

  it('БГ button has active class when lang is "bg"', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="bg" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    expect(screen.getAllByRole('button', { name: 'БГ' })[0].className).toContain('bg-primary')
  })
})

// ── theme toggle ──────────────────────────────────────────────────────────────

describe('theme toggle', () => {
  it('calls setTheme when theme button is clicked', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    fireEvent.click(screen.getAllByText('Light')[0])
    expect(setTheme).toHaveBeenCalled()
  })

  it('shows "Light" label when theme is dark', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    expect(screen.getAllByText('Light').length).toBeGreaterThan(0)
  })

  it('shows "Dark" label when theme is light', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="light" setTheme={setTheme} t={t} />)
    expect(screen.getAllByText('Dark').length).toBeGreaterThan(0)
  })

  it('passes a toggle function: dark switches to light', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    fireEvent.click(screen.getAllByText('Light')[0])
    const updater = setTheme.mock.calls[0][0]
    expect(updater('dark')).toBe('light')
    expect(updater('light')).toBe('dark')
  })

  it('theme button title is "Switch to light mode" when theme is dark', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="dark" setTheme={setTheme} t={t} />)
    expect(screen.getAllByTitle('Switch to light mode').length).toBeGreaterThan(0)
  })

  it('theme button title is "Switch to dark mode" when theme is light', () => {
    render(<TopBar onShowHelp={onShowHelp} lang="en" setLang={setLang} theme="light" setTheme={setTheme} t={t} />)
    expect(screen.getAllByTitle('Switch to dark mode').length).toBeGreaterThan(0)
  })
})
