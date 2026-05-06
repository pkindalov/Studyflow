import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import TaskBankModal from './TaskBankModal'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const makeTask = (id, text, priority = false) => ({ id, text, priority, imageUrl: '' })

let onConfirm, onClose, onRemoveFromBank, onAddToBank, onUpdateInBank, onReorderBank

beforeEach(() => {
  onConfirm = vi.fn()
  onClose = vi.fn()
  onRemoveFromBank = vi.fn()
  onAddToBank = vi.fn()
  onUpdateInBank = vi.fn()
  onReorderBank = vi.fn()
})

const baseProps = (overrides = {}) => ({
  taskBank: [],
  tasks: {},
  onConfirm,
  onClose,
  onRemoveFromBank,
  onAddToBank,
  onUpdateInBank,
  onReorderBank,
  ...overrides,
})

describe('header and tabs', () => {
  it('shows the modal title', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    expect(screen.getByText('Saved Task List')).toBeTruthy()
  })

  it('shows both tab buttons', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    expect(screen.getByText('Saved List')).toBeTruthy()
    expect(screen.getByText('From Date')).toBeTruthy()
  })
})

describe('list tab (default)', () => {
  it('shows empty-state message when taskBank is empty', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    expect(screen.getByText(/Your saved list is empty/)).toBeTruthy()
  })

  it('renders task names from taskBank', () => {
    const taskBank = [makeTask('a', 'Algebra Review'), makeTask('b', 'Write Summary')]
    wrap(<TaskBankModal {...baseProps({ taskBank })} />)
    expect(screen.getByText('Algebra Review')).toBeTruthy()
    expect(screen.getByText('Write Summary')).toBeTruthy()
  })

  it('shows search input when taskBank has tasks', () => {
    wrap(<TaskBankModal {...baseProps({ taskBank: [makeTask('a', 'Task A')] })} />)
    expect(screen.getByPlaceholderText('Search saved tasks…')).toBeTruthy()
  })

  it('hides search input when taskBank is empty', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    expect(screen.queryByPlaceholderText('Search saved tasks…')).toBeNull()
  })

  it('confirm button is disabled when nothing is selected', () => {
    wrap(<TaskBankModal {...baseProps({ taskBank: [makeTask('a', 'Task A')] })} />)
    const addBtn = screen.getByText('Add to today')
    expect(addBtn.closest('button')).toBeDisabled()
  })

  it('confirm button enables after selecting a task', () => {
    const taskBank = [makeTask('a', 'Task A')]
    wrap(<TaskBankModal {...baseProps({ taskBank })} />)
    const [checkbox] = screen.getAllByRole('checkbox')
    fireEvent.click(checkbox)
    expect(screen.getByText('Add to today').closest('button')).not.toBeDisabled()
  })

  it('calls onRemoveFromBank when delete button is clicked', () => {
    const taskBank = [makeTask('a', 'Task A')]
    wrap(<TaskBankModal {...baseProps({ taskBank })} />)
    fireEvent.click(screen.getByTitle('Remove from list'))
    expect(onRemoveFromBank).toHaveBeenCalledWith('a')
  })
})

describe('date tab', () => {
  it('switches to date tab when From Date is clicked', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    fireEvent.click(screen.getByText('From Date'))
    expect(screen.getByText('Pick a date to see its tasks.')).toBeTruthy()
  })

  it('shows tasks from the chosen date', () => {
    const tasks = { '2025-06-10': [{ id: 'x', text: 'Review Notes', done: false, priority: false }] }
    wrap(<TaskBankModal {...baseProps({ tasks })} />)
    fireEvent.click(screen.getByText('From Date'))
    fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2025-06-10' } })
    expect(screen.getByText('Review Notes')).toBeTruthy()
  })

  it('shows no-tasks message when date has no pending tasks', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    fireEvent.click(screen.getByText('From Date'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2025-06-10' } })
    expect(screen.getByText('No pending tasks on that date.')).toBeTruthy()
  })
})

describe('footer actions', () => {
  it('calls onClose when Cancel is clicked', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the header × icon button is clicked', () => {
    wrap(<TaskBankModal {...baseProps()} />)
    // Only one "close" icon text present when bank is empty (no edit rows)
    fireEvent.click(screen.getByText('close').closest('button'))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows "Add & Generate" label when withGenerate is true', () => {
    wrap(<TaskBankModal {...baseProps({ withGenerate: true })} />)
    expect(screen.getByText('Add to today & Generate')).toBeTruthy()
  })
})
