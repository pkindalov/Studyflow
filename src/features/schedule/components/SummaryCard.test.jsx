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

  it('renders the summaryMsgProgress text', () => {
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

// ── summary message branches ─────────────────────────────────────────────────────

describe('summary message branches', () => {
  it('shows the start message and no-tasks hint when there are no tasks', () => {
    wrap({ total: 0, completed: 0, remaining: 0, progress: 0 })
    expect(screen.getByText('Ready to begin — add tasks and start your session.')).toBeTruthy()
    expect(screen.getByText("Use 'Create Task' in the sidebar to add your first task.")).toBeTruthy()
  })

  it('shows the all-done message only when every task is completed', () => {
    wrap({ total: 5, completed: 5, remaining: 0, progress: 100 })
    expect(screen.getByText('All done for today — fantastic work!')).toBeTruthy()
  })

  it('does not show all-done when progress rounds to 100 but a task remains', () => {
    wrap({ total: 200, completed: 199, remaining: 1, progress: 100 })
    expect(screen.queryByText('All done for today — fantastic work!')).toBeNull()
    expect(screen.getByText("You're making great progress today.")).toBeTruthy()
  })
})

// ── progress ring aria-label ─────────────────────────────────────────────────────

describe('progress ring aria-label', () => {
  it('describes progress, completed and total for assistive tech', () => {
    wrap(base)
    expect(screen.getByRole('img', { name: '60% complete — 3 of 5 tasks done' })).toBeTruthy()
  })
})

// ── stat values ────────────────────────────────────────────────────────────────

describe('stat values', () => {
  it('renders total as-is without padding', () => {
    wrap({ ...base, total: 9 })
    expect(screen.getByText('9')).toBeTruthy()
  })

  it('shows single-digit completed as-is', () => {
    wrap({ ...base, completed: 6, remaining: 3 })
    expect(screen.getByText('6')).toBeTruthy()
  })

  it('shows multi-digit completed correctly', () => {
    wrap({ ...base, completed: 12 })
    expect(screen.getByText('12')).toBeTruthy()
  })

  it('shows single-digit remaining as-is', () => {
    wrap({ ...base, remaining: 4, completed: 1 })
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('shows multi-digit remaining correctly', () => {
    wrap({ ...base, remaining: 11 })
    expect(screen.getByText('11')).toBeTruthy()
  })

  it('shows 0 completed as "0"', () => {
    wrap({ ...base, completed: 0, remaining: 5 })
    expect(screen.getByText('0')).toBeTruthy()
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
