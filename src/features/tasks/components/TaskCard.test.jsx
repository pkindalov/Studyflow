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

  it('calls onStopRecurring with recurringId after opening overflow', () => {
    const onStopRecurring = vi.fn()
    wrap(<TaskCard task={{ ...base, recurringId: 'r1' }} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onStopRecurring={onStopRecurring} />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /stop this task from repeating/i }))
    expect(onStopRecurring).toHaveBeenCalledWith('r1')
  })

  it('calls onSaveToBank with task after opening overflow', () => {
    const onSaveToBank = vi.fn()
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onSaveToBank={onSaveToBank} />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /save to list/i }))
    expect(onSaveToBank).toHaveBeenCalledWith(base)
  })

  it('calls onSaveToBank when isInList is true after opening overflow', () => {
    const onSaveToBank = vi.fn()
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onSaveToBank={onSaveToBank} isInList={true} />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /remove from list/i }))
    expect(onSaveToBank).toHaveBeenCalledWith(base)
  })

  it('calls onToggleSelect with task id after opening overflow', () => {
    const onToggleSelect = vi.fn()
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onToggleSelect={onToggleSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /exclude from schedule/i }))
    expect(onToggleSelect).toHaveBeenCalledWith('t1')
  })

  it('omits overflow button when no secondary actions are provided', () => {
    wrap(<TaskCard task={base} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />)
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull()
  })
})

// ── overflow menu keyboard navigation ───────────────────────────────────────────

describe('overflow menu keyboard navigation', () => {
  // A recurring task with all three secondary actions yields three menu items.
  const openMenu = () => {
    wrap(
      <TaskCard
        task={{ ...base, recurringId: 'r1' }}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onSaveToBank={vi.fn()}
        onToggleSelect={vi.fn()}
        onStopRecurring={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    return screen.getAllByRole('menuitem')
  }

  it('focuses the first item when the menu opens', () => {
    const items = openMenu()
    expect(document.activeElement).toBe(items[0])
    expect(items[0].tabIndex).toBe(0)
    expect(items[1].tabIndex).toBe(-1)
  })

  it('moves focus down on ArrowDown and rolls the tabindex to the active item', () => {
    const items = openMenu()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
    expect(items[1].tabIndex).toBe(0)
    expect(items[0].tabIndex).toBe(-1)
  })

  it('wraps from the first item to the last on ArrowUp', () => {
    const items = openMenu()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[items.length - 1])
  })

  it('jumps to the ends with End and Home', () => {
    const items = openMenu()
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(items[items.length - 1])
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(items[0])
  })

  it('keeps exactly one item in the Tab order so Tab leaves the menu', () => {
    const items = openMenu()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' })
    const tabbable = items.filter((item) => item.tabIndex === 0)
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toBe(items[1])
  })
})
