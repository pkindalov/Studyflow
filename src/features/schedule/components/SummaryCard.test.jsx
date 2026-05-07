import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import SummaryCard from './SummaryCard'

const wrap = (props) =>
  render(
    <LangProvider>
      <SummaryCard {...props} />
    </LangProvider>
  )

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const base = { total: 5, completed: 3, remaining: 2, progress: 60 }

beforeEach(() => {
  localStorage.clear()
})

// ── i18n labels ───────────────────────────────────────────────────────────────

describe('i18n labels', () => {
  it('renders the focusProgressLabel heading', () => {
    wrap(base)
    expect(screen.getByText('Focus Progress')).toBeTruthy()
  })

  it('renders the greatProgressMsg text', () => {
    wrap(base)
    expect(screen.getByText("You're making great progress today.")).toBeTruthy()
  })

  it('renders the totalLabel label', () => {
    wrap(base)
    expect(screen.getAllByText('Total').length).toBeGreaterThan(0)
  })

  it('renders doneLabel twice — once in stats and once in the SVG center', () => {
    wrap(base)
    expect(screen.getAllByText('Done').length).toBe(2)
  })

  it('renders the leftLabel label', () => {
    wrap(base)
    expect(screen.getAllByText('Left').length).toBeGreaterThan(0)
  })
})

// ── stat values ────────────────────────────────────────────────────────────────

describe('stat values', () => {
  it('renders total as-is without padding', () => {
    wrap({ ...base, total: 9 })
    expect(screen.getByText('9')).toBeTruthy()
  })

  it('zero-pads single-digit completed to two digits', () => {
    wrap({ ...base, completed: 5, remaining: 4 })
    expect(screen.getByText('05')).toBeTruthy()
  })

  it('does not zero-pad completed when already two digits', () => {
    wrap({ ...base, completed: 12 })
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('zero-pads single-digit remaining to two digits', () => {
    wrap({ ...base, remaining: 4, completed: 1 })
    expect(screen.getByText('04')).toBeTruthy()
  })

  it('does not zero-pad remaining when already two digits', () => {
    wrap({ ...base, remaining: 11 })
    expect(screen.getByText('11')).toBeTruthy()
  })

  it('zero-pads 0 completed to "00"', () => {
    wrap({ ...base, completed: 0, remaining: 5 })
    expect(screen.getByText('00')).toBeTruthy()
  })

  it('renders progress% in the SVG center', () => {
    wrap({ ...base, progress: 75 })
    expect(screen.getByText('75%')).toBeTruthy()
  })

  it('renders 0% when progress is 0', () => {
    wrap({ ...base, progress: 0 })
    expect(screen.getByText('0%')).toBeTruthy()
  })

  it('renders 100% when progress is 100', () => {
    wrap({ ...base, progress: 100 })
    expect(screen.getByText('100%')).toBeTruthy()
  })
})

// ── SVG progress ring ──────────────────────────────────────────────────────────

describe('SVG progress ring', () => {
  const getProgressCircle = (container) => container.querySelectorAll('circle')[1]

  it('sets strokeDasharray to the full circumference (2π × 46)', () => {
    const { container } = wrap(base)
    const circle = getProgressCircle(container)
    expect(parseFloat(circle.getAttribute('stroke-dasharray'))).toBeCloseTo(CIRCUMFERENCE, 4)
  })

  it('strokeDashoffset equals the full circumference at 0% — empty ring', () => {
    const { container } = wrap({ ...base, progress: 0 })
    const circle = getProgressCircle(container)
    expect(parseFloat(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(CIRCUMFERENCE, 4)
  })

  it('strokeDashoffset is 0 at 100% — full ring', () => {
    const { container } = wrap({ ...base, progress: 100 })
    const circle = getProgressCircle(container)
    expect(parseFloat(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 4)
  })

  it('strokeDashoffset is half the circumference at 50%', () => {
    const { container } = wrap({ ...base, progress: 50 })
    const circle = getProgressCircle(container)
    expect(parseFloat(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(CIRCUMFERENCE / 2, 4)
  })

  it('strokeDashoffset decreases as progress increases', () => {
    const { container: c25 } = wrap({ ...base, progress: 25 })
    const { container: c75 } = wrap({ ...base, progress: 75 })
    const offset25 = parseFloat(getProgressCircle(c25).getAttribute('stroke-dashoffset'))
    const offset75 = parseFloat(getProgressCircle(c75).getAttribute('stroke-dashoffset'))
    expect(offset25).toBeGreaterThan(offset75)
  })
})
