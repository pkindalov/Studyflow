import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import TaskCard from './TaskCard'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const base = { id: 't1', text: 'Learn React', done: false }

let onToggle, onDelete, onEdit

beforeEach(() => {
  onToggle = vi.fn()
  onDelete = vi.fn()
  onEdit = vi.fn()
  localStorage.clear()
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders task text', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.getByText('Learn React')).toBeTruthy()
  })

  it('applies line-through when task is done', () => {
    wrap(<TaskCard task={{ ...base, done: true }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.getByText('Learn React').className).toContain('line-through')
  })

  it('shows recurring badge when recurringId is present', () => {
    wrap(<TaskCard task={{ ...base, recurringId: 'r1' }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.getByText('Repeat')).toBeTruthy()
  })

  it('hides recurring badge when no recurringId', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.queryByText('Repeat')).toBeNull()
  })

  it('renders image when imageUrl is set', () => {
    wrap(<TaskCard task={{ ...base, imageUrl: 'http://x.test/img.png' }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.getByAltText('Task visual')).toBeTruthy()
  })

  it('omits image when imageUrl is absent', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.queryByAltText('Task visual')).toBeNull()
  })
})

// ── toggle ────────────────────────────────────────────────────────────────────

describe('toggle button', () => {
  it('calls onToggle with task id', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark as complete' }))
    expect(onToggle).toHaveBeenCalledWith('t1')
  })

  it('shows "Mark as incomplete" label when task is done', () => {
    wrap(<TaskCard task={{ ...base, done: true }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.getByRole('button', { name: 'Mark as incomplete' })).toBeTruthy()
  })
})

// ── edit ──────────────────────────────────────────────────────────────────────

describe('edit', () => {
  it('calls onEdit when edit button is clicked', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }))
    expect(onEdit).toHaveBeenCalledWith(base)
  })

  it('calls onEdit on double-click of task text', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.dblClick(screen.getByText('Learn React'))
    expect(onEdit).toHaveBeenCalledWith(base)
  })
})

// ── delete flow ───────────────────────────────────────────────────────────────

describe('delete flow', () => {
  it('shows confirm dialog when delete button is clicked', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    expect(screen.getByText(/Delete task\?/)).toBeTruthy()
  })

  it('calls onDelete and closes dialog on confirm', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledWith('t1')
    expect(screen.queryByText(/Delete task\?/)).toBeNull()
  })

  it('cancels without calling onDelete', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByText(/Delete task\?/)).toBeNull()
  })

  it('shows recurring warning in dialog for recurring task', () => {
    wrap(<TaskCard task={{ ...base, recurringId: 'r1' }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Delete task' }))
    expect(screen.getByText(/This is a recurring task/)).toBeTruthy()
  })
})

// ── optional buttons ──────────────────────────────────────────────────────────

describe('optional buttons', () => {
  it('renders timer button and calls onOpenTimer with task', () => {
    const onOpenTimer = vi.fn()
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onOpenTimer={onOpenTimer} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(onOpenTimer).toHaveBeenCalledWith(base)
  })

  it('omits timer button when onOpenTimer is not provided', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.queryByRole('button', { name: 'Start timer' })).toBeNull()
  })

  it('calls onStopRecurring with recurringId', () => {
    const onStopRecurring = vi.fn()
    wrap(<TaskCard task={{ ...base, recurringId: 'r1' }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onStopRecurring={onStopRecurring} />)
    fireEvent.click(screen.getByRole('button', { name: 'Stop repeating' }))
    expect(onStopRecurring).toHaveBeenCalledWith('r1')
  })

  it('calls onSaveToBank with task', () => {
    const onSaveToBank = vi.fn()
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onSaveToBank={onSaveToBank} />)
    fireEvent.click(screen.getByRole('button', { name: 'Saved to list!' }))
    expect(onSaveToBank).toHaveBeenCalledWith(base)
  })
})
