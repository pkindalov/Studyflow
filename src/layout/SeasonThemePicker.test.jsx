import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SeasonThemePicker from './SeasonThemePicker'

const t = {
  themePickerAria: 'Choose season theme',
  themeAuto: 'Auto',
  themeSpring: 'Spring',
  themeSummer: 'Summer',
  themeAutumn: 'Autumn',
  themeWinter: 'Winter',
  themeAutoHint: (season) => `Auto — currently ${season}`,
}

let setThemeChoice

beforeEach(() => {
  setThemeChoice = vi.fn()
})

const renderPicker = (props = {}) =>
  render(
    <SeasonThemePicker
      themeChoice="auto"
      setThemeChoice={setThemeChoice}
      activeSeason="summer"
      t={t}
      {...props}
    />
  )

// ── trigger button ────────────────────────────────────────────────────────────

describe('trigger button', () => {
  it('shows "Auto" as the label when themeChoice is auto', () => {
    renderPicker()
    expect(screen.getByRole('button', { name: /auto — currently summer/i })).toBeInTheDocument()
  })

  it('shows the season name as the label when a specific season is chosen', () => {
    renderPicker({ themeChoice: 'winter', activeSeason: 'winter' })
    expect(screen.getByRole('button', { name: 'Winter' })).toBeInTheDocument()
  })

  it('is closed by default', () => {
    renderPicker()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('opens the menu on click', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('sets aria-expanded to true when open', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })
})

// ── menu ──────────────────────────────────────────────────────────────────────

describe('menu', () => {
  it('lists Auto plus all four seasons', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(5)
    ;['Auto', 'Spring', 'Summer', 'Autumn', 'Winter'].forEach((label) => {
      expect(screen.getByRole('menuitem', { name: label })).toBeInTheDocument()
    })
  })

  it('marks the currently chosen option as selected via aria-current', () => {
    renderPicker({ themeChoice: 'autumn', activeSeason: 'autumn' })
    fireEvent.click(screen.getByRole('button'))
    const autumnItem = screen.getByRole('menuitem', { name: /autumn/i })
    expect(autumnItem).toHaveAttribute('aria-current', 'true')
  })

  it('calls setThemeChoice with the clicked season id and closes the menu', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /^spring$/i }))
    expect(setThemeChoice).toHaveBeenCalledWith('spring')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('calls setThemeChoice with "auto" when the Auto option is clicked', () => {
    renderPicker({ themeChoice: 'winter', activeSeason: 'winter' })
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('menuitem', { name: /^auto$/i }))
    expect(setThemeChoice).toHaveBeenCalledWith('auto')
  })

  it('closes when Escape is pressed', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on outside click', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button'))
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
