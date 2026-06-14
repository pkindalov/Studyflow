import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SchedulePanel from './SchedulePanel'

const t = {
  todaysSchedule: "Today's Schedule",
  saveSchedule: 'Save Schedule',
  delete: 'Delete',
  scheduleAllDoneHeadline: 'Session Complete!',
  scheduleAllDoneBody: 'You crushed every task on the schedule.',
  minUnit: 'min',
  priorityBadge: 'Priority',
  completedStatus: 'Completed',
  runningStatus: 'Running — click to view',
  resumeTimerStatus: 'Resume timer',
  startTimerStatus: 'Start timer',
  markDoneEarly: 'Mark as Done',
  removeFromSchedule: 'Remove from schedule',
}

const schedule = [
  { id: 's1', text: 'Study math', scheduledMinutes: 30, done: false },
  { id: 's2', text: 'Read chapter', scheduledMinutes: 45, done: false },
]

const defaultProps = {
  schedule,
  allScheduleDone: false,
  scheduleTimers: {},
  runningTaskId: null,
  scheduleSensors: [],
  onScheduleDragEnd: vi.fn(),
  onOpenTimer: vi.fn(),
  onMarkDone: vi.fn(),
  onRemove: vi.fn(),
  onSave: vi.fn(),
  onDelete: vi.fn(),
  t,
}

beforeEach(() => {
  Object.values(defaultProps).forEach((v) => typeof v === 'function' && vi.clearAllMocks?.())
  defaultProps.onScheduleDragEnd = vi.fn()
  defaultProps.onOpenTimer = vi.fn()
  defaultProps.onMarkDone = vi.fn()
  defaultProps.onRemove = vi.fn()
  defaultProps.onSave = vi.fn()
  defaultProps.onDelete = vi.fn()
})

// ── rendering ─────────────────────────────────────────────────────────────────

describe('rendering', () => {
  it('renders all schedule item texts', () => {
    render(<SchedulePanel {...defaultProps} />)
    expect(screen.getByText('Study math')).toBeTruthy()
    expect(screen.getByText('Read chapter')).toBeTruthy()
  })

  it('shows the schedule heading when not all done', () => {
    render(<SchedulePanel {...defaultProps} />)
    expect(screen.getByText("Today's Schedule")).toBeTruthy()
  })

  it('shows Save Schedule and Delete buttons', () => {
    render(<SchedulePanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Save Schedule/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^delete/i })).toBeTruthy()
  })
})

// ── all-done state ────────────────────────────────────────────────────────────

describe('all done state', () => {
  it('shows celebration headline when allScheduleDone is true', () => {
    render(<SchedulePanel {...defaultProps} allScheduleDone={true} />)
    expect(screen.getByText('Session Complete!')).toBeTruthy()
  })

  it('hides the normal heading when allScheduleDone is true', () => {
    render(<SchedulePanel {...defaultProps} allScheduleDone={true} />)
    expect(screen.queryByText("Today's Schedule")).toBeNull()
  })

  it('hides task items when allScheduleDone is true', () => {
    render(<SchedulePanel {...defaultProps} allScheduleDone={true} />)
    expect(screen.queryByText('Study math')).toBeNull()
    expect(screen.queryByText('Read chapter')).toBeNull()
  })
})

// ── panel-level callbacks ─────────────────────────────────────────────────────

describe('panel-level callbacks', () => {
  it('calls onSave when Save Schedule is clicked', () => {
    render(<SchedulePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Save Schedule/i }))
    expect(defaultProps.onSave).toHaveBeenCalled()
  })

  it('calls onDelete when Delete button is clicked', () => {
    render(<SchedulePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /^delete/i }))
    expect(defaultProps.onDelete).toHaveBeenCalled()
  })
})

// ── item callbacks passed through ────────────────────────────────────────────

describe('item callbacks', () => {
  it('calls onMarkDone with item id when mark-done clicked on first item', () => {
    render(<SchedulePanel {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('Mark as Done')[0])
    expect(defaultProps.onMarkDone).toHaveBeenCalledWith('s1')
  })

  it('calls onRemove with item id when remove clicked on second item', () => {
    render(<SchedulePanel {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('Remove from schedule')[1])
    expect(defaultProps.onRemove).toHaveBeenCalledWith('s2')
  })

  it('calls onOpenTimer with the correct task when timer button on first item is clicked', () => {
    render(<SchedulePanel {...defaultProps} />)
    fireEvent.click(screen.getAllByTitle('Start timer')[0])
    expect(defaultProps.onOpenTimer).toHaveBeenCalledWith(schedule[0])
  })
})

// ── edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('renders heading and action buttons when schedule is empty', () => {
    render(<SchedulePanel {...defaultProps} schedule={[]} />)
    expect(screen.getByText("Today's Schedule")).toBeTruthy()
    expect(screen.getByRole('button', { name: /Save Schedule/i })).toBeTruthy()
    expect(screen.queryByTitle('Start timer')).toBeNull()
  })

  it('passes scheduleTimers elapsed to items — running item shows "Running" title', () => {
    render(<SchedulePanel {...defaultProps} scheduleTimers={{ s1: 300 }} runningTaskId='s1' />)
    expect(screen.getByTitle('Running — click to view')).toBeTruthy()
  })
})
