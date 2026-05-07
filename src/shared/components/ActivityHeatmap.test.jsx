import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActivityHeatmap from './ActivityHeatmap'

// Fix "today" to Jan 11, 2026 (a Sunday) so the 26-week grid is deterministic.
// Grid spans: July 20, 2025 (Sunday) → Jan 17, 2026.
// All dates through Jan 11 are past; Jan 12–17 are future.
beforeAll(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-11T12:00:00'))
})

afterAll(() => {
  vi.useRealTimers()
})

describe('legend', () => {
  it('renders Less and More labels', () => {
    render(<ActivityHeatmap heatmap={{}} selectedDate={null} onSelectDate={vi.fn()} />)
    expect(screen.getByText('Less')).toBeTruthy()
    expect(screen.getByText('More')).toBeTruthy()
  })
})

describe('month labels', () => {
  it('renders at least one month label', () => {
    render(<ActivityHeatmap heatmap={{}} selectedDate={null} onSelectDate={vi.fn()} />)
    // Jul is the first month in the grid window
    expect(screen.getByText('Jul')).toBeTruthy()
  })
})

describe('cell tooltips', () => {
  it('shows a "tasks done" tooltip for a date with heatmap data', () => {
    render(
      <ActivityHeatmap heatmap={{ '2025-10-15': 2 }} selectedDate={null} onSelectDate={vi.fn()} />
    )
    expect(screen.getByTitle('Oct 15, 2025 · 2 tasks done')).toBeTruthy()
  })

  it('uses singular "task" when count is 1', () => {
    render(
      <ActivityHeatmap heatmap={{ '2025-10-15': 1 }} selectedDate={null} onSelectDate={vi.fn()} />
    )
    expect(screen.getByTitle('Oct 15, 2025 · 1 task done')).toBeTruthy()
  })

  it('shows "No tasks done" tooltip for a past date with no data', () => {
    render(<ActivityHeatmap heatmap={{}} selectedDate={null} onSelectDate={vi.fn()} />)
    expect(screen.getByTitle('Oct 15, 2025 · No tasks done')).toBeTruthy()
  })
})

describe('cell interaction', () => {
  it('calls onSelectDate with the date string when a past cell is clicked', () => {
    const onSelectDate = vi.fn()
    render(
      <ActivityHeatmap heatmap={{ '2025-10-15': 1 }} selectedDate={null} onSelectDate={onSelectDate} />
    )
    fireEvent.click(screen.getByTitle('Oct 15, 2025 · 1 task done'))
    expect(onSelectDate).toHaveBeenCalledWith('2025-10-15')
  })

  it('calls onSelectDate with null when the already-selected cell is clicked', () => {
    const onSelectDate = vi.fn()
    render(
      <ActivityHeatmap
        heatmap={{ '2025-10-15': 1 }}
        selectedDate="2025-10-15"
        onSelectDate={onSelectDate}
      />
    )
    fireEvent.click(screen.getByTitle('Oct 15, 2025 · 1 task done'))
    expect(onSelectDate).toHaveBeenCalledWith(null)
  })
})

describe('selected date highlighting', () => {
  it('applies ring class to the selected cell', () => {
    render(
      <ActivityHeatmap
        heatmap={{ '2025-10-15': 1 }}
        selectedDate="2025-10-15"
        onSelectDate={vi.fn()}
      />
    )
    const cell = screen.getByTitle('Oct 15, 2025 · 1 task done')
    expect(cell.className).toContain('ring-1')
  })

  it('does not apply ring class to an unselected cell', () => {
    render(
      <ActivityHeatmap
        heatmap={{ '2025-10-15': 1 }}
        selectedDate={null}
        onSelectDate={vi.fn()}
      />
    )
    const cell = screen.getByTitle('Oct 15, 2025 · 1 task done')
    expect(cell.className).not.toContain('ring-1')
  })
})
