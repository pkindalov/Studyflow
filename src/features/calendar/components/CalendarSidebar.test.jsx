import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import CalendarSidebar from './CalendarSidebar'

vi.mock('react-calendar', () => ({
  default: ({ onChange }) => (
    <button data-testid="calendar-widget" onClick={() => onChange(new Date('2025-06-15'))}>
      Calendar
    </button>
  ),
}))

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

let onAddClick, setSelectedDate, onToggleCompletion

beforeEach(() => {
  onAddClick = vi.fn()
  setSelectedDate = vi.fn()
  onToggleCompletion = vi.fn()
  localStorage.clear()
})

const baseProps = (overrides = {}) => ({
  selectedDate: new Date('2025-06-01'),
  setSelectedDate,
  markDateWithTasks: vi.fn(() => null),
  onAddClick,
  showCompletion: false,
  onToggleCompletion,
  ...overrides,
})

describe('create task button', () => {
  it('shows the Create Task button', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    expect(screen.getByText('Create Task')).toBeTruthy()
  })

  it('calls onAddClick when Create Task is clicked', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    fireEvent.click(screen.getByText('Create Task'))
    expect(onAddClick).toHaveBeenCalledOnce()
  })
})

describe('month overview toggle', () => {
  it('shows the Month overview label', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    expect(screen.getByText('Month overview')).toBeTruthy()
  })

  it('toggle switch aria-checked reflects showCompletion=false', () => {
    wrap(<CalendarSidebar {...baseProps({ showCompletion: false })} />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
  })

  it('toggle switch aria-checked reflects showCompletion=true', () => {
    wrap(<CalendarSidebar {...baseProps({ showCompletion: true })} />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })

  it('calls onToggleCompletion when toggle is clicked', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onToggleCompletion).toHaveBeenCalledOnce()
  })
})

describe('calendar widget', () => {
  it('renders the calendar widget', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    expect(screen.getByTestId('calendar-widget')).toBeTruthy()
  })

  it('calls setSelectedDate when a date is picked', () => {
    wrap(<CalendarSidebar {...baseProps()} />)
    fireEvent.click(screen.getByTestId('calendar-widget'))
    expect(setSelectedDate).toHaveBeenCalledWith(new Date('2025-06-15'))
  })
})
