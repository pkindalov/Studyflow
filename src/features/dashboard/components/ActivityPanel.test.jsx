import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import { ActivityPanel } from './ActivityPanel'

vi.mock('../../../shared/hooks/useActivityStats', () => ({
  useActivityStats: vi.fn(() => ({
    streak: 3,
    activeToday: true,
    totalFocusSeconds: 7200,
    todayFocusSeconds: 1800,
    heatmap: {},
  })),
}))

vi.mock('../../../shared/components/ActivityHeatmap', () => ({
  default: ({ onSelectDate }) => (
    <div data-testid="activity-heatmap" onClick={() => onSelectDate('2025-06-10')} />
  ),
}))

import { useActivityStats } from '../../../shared/hooks/useActivityStats'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

beforeEach(() => {
  localStorage.clear()
  vi.mocked(useActivityStats).mockReturnValue({
    streak: 3,
    activeToday: true,
    totalFocusSeconds: 7200,
    todayFocusSeconds: 1800,
    heatmap: {},
  })
})

describe('header', () => {
  it('shows the Activity heading', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('Activity')).toBeTruthy()
  })
})

describe('stats row', () => {
  it('shows the streak count', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('3')).toBeTruthy()
  })

  it('shows "Active today!" when streak > 0 and activeToday is true', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('Active today!')).toBeTruthy()
  })

  it('shows "Keep it going!" when streak > 0 and activeToday is false', () => {
    vi.mocked(useActivityStats).mockReturnValue({
      streak: 3,
      activeToday: false,
      totalFocusSeconds: 7200,
      todayFocusSeconds: 1800,
      heatmap: {},
    })
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('Keep it going!')).toBeTruthy()
  })

  it('shows "Complete a task to start" when streak is 0', () => {
    vi.mocked(useActivityStats).mockReturnValue({
      streak: 0,
      activeToday: false,
      totalFocusSeconds: 0,
      todayFocusSeconds: 0,
      heatmap: {},
    })
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('Complete a task to start')).toBeTruthy()
  })
})

describe('heatmap', () => {
  it('renders the heatmap', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByTestId('activity-heatmap')).toBeTruthy()
  })

  it('shows the Last 6 months label', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.getByText('Last 6 months')).toBeTruthy()
  })
})

describe('selected day detail', () => {
  it('shows detail panel when a date is selected from the heatmap', () => {
    vi.mocked(useActivityStats).mockReturnValue({
      streak: 0,
      activeToday: false,
      totalFocusSeconds: 0,
      todayFocusSeconds: 0,
      heatmap: { '2025-06-10': 2 },
    })
    wrap(<ActivityPanel tasks={{}} />)
    fireEvent.click(screen.getByTestId('activity-heatmap'))
    expect(screen.getByText('Selected day')).toBeTruthy()
  })

  it('hides detail panel before any date is selected', () => {
    wrap(<ActivityPanel tasks={{}} />)
    expect(screen.queryByText('Selected day')).toBeNull()
  })

  it('clears the selected day when the × button is clicked', () => {
    vi.mocked(useActivityStats).mockReturnValue({
      streak: 0,
      activeToday: false,
      totalFocusSeconds: 0,
      todayFocusSeconds: 0,
      heatmap: { '2025-06-10': 2 },
    })
    wrap(<ActivityPanel tasks={{}} />)
    fireEvent.click(screen.getByTestId('activity-heatmap'))
    expect(screen.getByText('Selected day')).toBeTruthy()
    fireEvent.click(screen.getByTitle('Deselect'))
    expect(screen.queryByText('Selected day')).toBeNull()
  })

  it('lists only the done tasks for the selected day', () => {
    const tasks = {
      '2025-06-10': [
        { id: 't1', text: 'Read chapter 1', done: true },
        { id: 't2', text: 'Draft essay', done: false },
        { id: 't3', text: 'Review flashcards', done: true, priority: true },
      ],
    }
    wrap(<ActivityPanel tasks={tasks} />)
    fireEvent.click(screen.getByTestId('activity-heatmap'))

    expect(screen.getByText('Read chapter 1')).toBeTruthy()
    expect(screen.getByText('Review flashcards')).toBeTruthy()
    expect(screen.queryByText('Draft essay')).toBeNull()
    expect(screen.getByText('2 tasks done')).toBeTruthy()
  })

  it('shows the empty-state message when the selected day has no done tasks', () => {
    const tasks = {
      '2025-06-10': [{ id: 't1', text: 'Draft essay', done: false }],
    }
    wrap(<ActivityPanel tasks={tasks} />)
    fireEvent.click(screen.getByTestId('activity-heatmap'))

    expect(screen.getByText('No tasks done')).toBeTruthy()
    expect(screen.getByText('0 tasks done')).toBeTruthy()
  })

  it('calls onNavigateToDate with the selected day when the calendar button is clicked', () => {
    const onNavigateToDate = vi.fn()
    wrap(<ActivityPanel tasks={{}} onNavigateToDate={onNavigateToDate} />)
    fireEvent.click(screen.getByTestId('activity-heatmap'))
    fireEvent.click(screen.getByTitle('Show this day on the calendar'))

    expect(onNavigateToDate).toHaveBeenCalledTimes(1)
    const passedDate = onNavigateToDate.mock.calls[0][0]
    expect(passedDate).toEqual(new Date('2025-06-10T00:00:00'))
  })
})
