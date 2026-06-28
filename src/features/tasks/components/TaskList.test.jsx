import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import TaskList from './TaskList'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const makeTask = (n) => ({ id: `t${n}`, text: `Task ${n}`, done: false })

let onToggle, onDelete, onEdit, onReorder

beforeEach(() => {
  onToggle = vi.fn()
  onDelete = vi.fn()
  onEdit = vi.fn()
  onReorder = vi.fn()
  localStorage.clear()
})

// ── empty state ───────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows the empty-state message when tasks array is empty', () => {
    wrap(<TaskList tasks={[]} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.getByText('No tasks for this day.')).toBeTruthy()
  })

  it('shows saved-list button in empty state when onOpenSavedList is provided', () => {
    const onOpenSavedList = vi.fn()
    wrap(<TaskList tasks={[]} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onOpenSavedList={onOpenSavedList} savedListTexts={new Set()} />)
    // The "Use saved list" button appears in empty state
    expect(screen.getByRole('button', { name: /Use saved list/ })).toBeTruthy()
  })
})

// ── task rendering ────────────────────────────────────────────────────────────

describe('task rendering', () => {
  it('renders each task by text', () => {
    const tasks = [makeTask(1), makeTask(2), makeTask(3)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.getByText('Task 1')).toBeTruthy()
    expect(screen.getByText('Task 2')).toBeTruthy()
    expect(screen.getByText('Task 3')).toBeTruthy()
  })

  it('shows the section heading', () => {
    wrap(<TaskList tasks={[makeTask(1)]} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.getByText("Today's Tasks")).toBeTruthy()
  })
})

// ── selection controls ────────────────────────────────────────────────────────

describe('selection controls', () => {
  it('shows "Exclude all" when onToggleSelect is provided and no task is excluded', () => {
    const tasks = [makeTask(1), makeTask(2)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={vi.fn()} excludedTaskIds={new Set()} />)
    expect(screen.getByText('Exclude all')).toBeTruthy()
  })

  it('shows "Exclude all" when all tasks are selected (no exclusions)', () => {
    const tasks = [makeTask(1)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={vi.fn()} excludedTaskIds={new Set()} />)
    expect(screen.getByText('Exclude all')).toBeTruthy()
  })

  it('shows "Include all" when some tasks are excluded', () => {
    const tasks = [makeTask(1), makeTask(2)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={vi.fn()} excludedTaskIds={new Set(['t1'])} />)
    expect(screen.getByText('Include all')).toBeTruthy()
  })

  it('hides selection controls when onToggleSelect is not provided', () => {
    wrap(<TaskList tasks={[makeTask(1)]} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.queryByText('Include all')).toBeNull()
    expect(screen.queryByText('Exclude all')).toBeNull()
  })

  it('clicking "Exclude all" calls onToggleSelect for each non-excluded task', () => {
    const onToggleSelect = vi.fn()
    const tasks = [makeTask(1), makeTask(2)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={onToggleSelect} excludedTaskIds={new Set()} />)
    fireEvent.click(screen.getByText('Exclude all'))
    expect(onToggleSelect).toHaveBeenCalledTimes(2)
    expect(onToggleSelect).toHaveBeenCalledWith('t1')
    expect(onToggleSelect).toHaveBeenCalledWith('t2')
  })

  it('renders the excluded-count hint when some tasks are excluded', () => {
    const tasks = [makeTask(1), makeTask(2), makeTask(3)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={vi.fn()} excludedTaskIds={new Set(['t1', 't2'])} />)
    expect(screen.getByText(/2 tasks excluded from schedule/)).toBeTruthy()
  })

  it('renders singular excluded-count hint when exactly one task is excluded', () => {
    const tasks = [makeTask(1), makeTask(2)]
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} onToggleSelect={vi.fn()} excludedTaskIds={new Set(['t1'])} />)
    expect(screen.getByText(/1 task excluded from schedule/)).toBeTruthy()
  })
})

// ── pagination ────────────────────────────────────────────────────────────────

describe('pagination', () => {
  it('hides pagination when tasks fit on one page', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask(i + 1))
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.queryByText('Next')).toBeNull()
  })

  it('shows pagination and Next button when tasks exceed page size', () => {
    const tasks = Array.from({ length: 9 }, (_, i) => makeTask(i + 1))
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.getByText('Next')).toBeTruthy()
  })

  it('navigates to the next page showing tasks beyond the first 8', () => {
    const tasks = Array.from({ length: 9 }, (_, i) => makeTask(i + 1))
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    expect(screen.queryByText('Task 9')).toBeNull()
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Task 9')).toBeTruthy()
  })

  it('Prev button navigates back to page 1', () => {
    const tasks = Array.from({ length: 9 }, (_, i) => makeTask(i + 1))
    wrap(<TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onReorder={onReorder} />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Task 9')).toBeTruthy()
    fireEvent.click(screen.getByText('Prev'))
    expect(screen.queryByText('Task 9')).toBeNull()
    expect(screen.getByText('Task 1')).toBeTruthy()
  })
})
