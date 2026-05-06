import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import TaskModal from './TaskModal'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const baseProps = () => ({
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  text: '',
  setText: vi.fn(),
  image: '',
  setImage: vi.fn(),
  priority: false,
  setPriority: vi.fn(),
  title: 'Add New Task',
})

describe('visibility', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = wrap(<TaskModal {...baseProps()} isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the modal when isOpen is true', () => {
    wrap(<TaskModal {...baseProps()} />)
    expect(screen.getByText('Add New Task')).toBeTruthy()
  })
})

describe('content', () => {
  it('shows the title prop', () => {
    wrap(<TaskModal {...baseProps()} title="Edit Task" />)
    expect(screen.getByText('Edit Task')).toBeTruthy()
  })

  it('shows the text value in the textarea', () => {
    wrap(<TaskModal {...baseProps()} text="My Task" />)
    expect(screen.getByDisplayValue('My Task')).toBeTruthy()
  })

  it('shows the priority checkbox', () => {
    wrap(<TaskModal {...baseProps()} />)
    expect(screen.getByRole('checkbox')).toBeTruthy()
  })

  it('priority checkbox reflects the priority prop', () => {
    wrap(<TaskModal {...baseProps()} priority={true} />)
    expect(screen.getByRole('checkbox').checked).toBe(true)
  })
})

describe('actions', () => {
  it('calls onClose when the close (×) button is clicked', () => {
    const onClose = vi.fn()
    wrap(<TaskModal {...baseProps()} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    wrap(<TaskModal {...baseProps()} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn()
    wrap(<TaskModal {...baseProps()} onSave={onSave} />)
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledOnce()
  })

  it('calls setText when textarea changes', () => {
    const setText = vi.fn()
    wrap(<TaskModal {...baseProps()} setText={setText} />)
    fireEvent.change(screen.getByPlaceholderText('Task description...'), { target: { value: 'New text' } })
    expect(setText).toHaveBeenCalledWith('New text')
  })
})

describe('recurrence section', () => {
  it('shows recurrence section when setRecurrence is provided', () => {
    wrap(<TaskModal {...baseProps()} recurrence="none" setRecurrence={vi.fn()} startDate="" setStartDate={vi.fn()} endDate="" setEndDate={vi.fn()} monthsAhead={3} setMonthsAhead={vi.fn()} yearsAhead={1} setYearsAhead={vi.fn()} />)
    expect(screen.getByText('Repeat')).toBeTruthy()
  })

  it('hides recurrence section when setRecurrence is not provided', () => {
    wrap(<TaskModal {...baseProps()} />)
    expect(screen.queryByText('Repeat')).toBeNull()
  })

  it('shows recurring instance note when isRecurringInstance is true', () => {
    wrap(<TaskModal {...baseProps()} recurrence="daily" setRecurrence={vi.fn()} startDate="" setStartDate={vi.fn()} endDate="" setEndDate={vi.fn()} monthsAhead={3} setMonthsAhead={vi.fn()} yearsAhead={1} setYearsAhead={vi.fn()} isRecurringInstance={true} />)
    expect(screen.getByText('Changes to the repeat pattern will apply to all instances.')).toBeTruthy()
  })

  it('hides recurring instance note when isRecurringInstance is false', () => {
    wrap(<TaskModal {...baseProps()} recurrence="none" setRecurrence={vi.fn()} startDate="" setStartDate={vi.fn()} endDate="" setEndDate={vi.fn()} monthsAhead={3} setMonthsAhead={vi.fn()} yearsAhead={1} setYearsAhead={vi.fn()} isRecurringInstance={false} />)
    expect(screen.queryByText('Changes to the repeat pattern will apply to all instances.')).toBeNull()
  })
})

describe('move-to-date section', () => {
  it('shows move-to-date section when setMoveToDate is provided', () => {
    wrap(<TaskModal {...baseProps()} moveToDate="" setMoveToDate={vi.fn()} />)
    expect(screen.getByText('Move to date')).toBeTruthy()
  })

  it('hides move-to-date section when setMoveToDate is not provided', () => {
    wrap(<TaskModal {...baseProps()} />)
    expect(screen.queryByText('Move to date')).toBeNull()
  })
})
