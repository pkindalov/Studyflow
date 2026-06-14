import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScheduleItem from './ScheduleItem'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

const t = {
  minUnit: 'min',
  priorityBadge: 'Priority',
  completedStatus: 'Completed',
  runningStatus: 'Running — click to view',
  resumeTimerStatus: 'Resume timer',
  startTimerStatus: 'Start timer',
  markDoneEarly: 'Mark as Done',
  removeFromSchedule: 'Remove from schedule',
}

const base = { id: 's1', text: 'Study math', scheduledMinutes: 30, done: false }

let onOpenTimer, onMarkDone, onRemove

beforeEach(() => {
  onOpenTimer = vi.fn()
  onMarkDone = vi.fn()
  onRemove = vi.fn()
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders task text', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByText('Study math')).toBeTruthy()
  })

  it('renders scheduledMinutes with minUnit', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByText('30 min')).toBeTruthy()
  })

  it('shows priority badge when task.priority is true', () => {
    render(<ScheduleItem task={{ ...base, priority: true }} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByText('Priority')).toBeTruthy()
  })

  it('hides priority badge when task.priority is false', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.queryByText('Priority')).toBeNull()
  })
})

// ── timer button states ───────────────────────────────────────────────────────

describe('timer button title', () => {
  it('shows "Start timer" title by default', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Start timer')).toBeTruthy()
  })

  it('shows "Completed" title when task is done', () => {
    render(<ScheduleItem task={{ ...base, done: true }} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Completed')).toBeTruthy()
  })

  it('shows "Resume timer" title when elapsed > 0 and not finished', () => {
    render(<ScheduleItem task={base} elapsed={300} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Resume timer')).toBeTruthy()
  })

  it('shows "Running" title when isRunning is true', () => {
    render(<ScheduleItem task={base} elapsed={300} isRunning={true} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Running — click to view')).toBeTruthy()
  })

  it('shows "Running" title when isRunning is true even with no elapsed time', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={true} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Running — click to view')).toBeTruthy()
  })
})

// ── callbacks ─────────────────────────────────────────────────────────────────

describe('callbacks', () => {
  it('calls onOpenTimer with task when timer button is clicked', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    fireEvent.click(screen.getByTitle('Start timer'))
    expect(onOpenTimer).toHaveBeenCalledWith(base)
  })

  it('calls onMarkDone with task id when mark-done button clicked', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    fireEvent.click(screen.getByTitle('Mark as Done'))
    expect(onMarkDone).toHaveBeenCalledWith('s1')
  })

  it('calls onRemove with task id when remove button clicked', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    fireEvent.click(screen.getByTitle('Remove from schedule'))
    expect(onRemove).toHaveBeenCalledWith('s1')
  })
})

// ── mark-done button visibility ───────────────────────────────────────────────

describe('mark-done button visibility', () => {
  it('shows mark-done button when task is not finished', () => {
    render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.getByTitle('Mark as Done')).toBeTruthy()
  })

  it('hides mark-done button when task.done is true', () => {
    render(<ScheduleItem task={{ ...base, done: true }} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.queryByTitle('Mark as Done')).toBeNull()
  })

  it('hides mark-done button when elapsed reaches total', () => {
    render(<ScheduleItem task={base} elapsed={1800} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(screen.queryByTitle('Mark as Done')).toBeNull()
  })
})

// ── progress bar ──────────────────────────────────────────────────────────────

describe('progress bar', () => {
  it('shows progress bar when elapsed > 0', () => {
    const { container } = render(<ScheduleItem task={base} elapsed={600} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(container.querySelector('.absolute.bottom-0')).toBeTruthy()
  })

  it('hides progress bar when elapsed is 0', () => {
    const { container } = render(<ScheduleItem task={base} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(container.querySelector('.absolute.bottom-0')).toBeNull()
  })

  it('shows progress bar when task.done is true regardless of elapsed', () => {
    const { container } = render(<ScheduleItem task={{ ...base, done: true }} elapsed={0} isRunning={false} onOpenTimer={onOpenTimer} onMarkDone={onMarkDone} onRemove={onRemove} t={t} />)
    expect(container.querySelector('.absolute.bottom-0')).toBeTruthy()
  })
})
