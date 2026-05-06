import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MainContent from './MainContent'

let lastSummaryCardProps = {}
let lastTaskListProps = {}
let lastSchedulePanelProps = {}

vi.mock('../features/schedule/components/SummaryCard', () => ({
  default: (props) => { lastSummaryCardProps = props; return <div data-testid="summary-card" /> },
}))
vi.mock('../features/tasks/components/TaskList', () => ({
  default: (props) => { lastTaskListProps = props; return <div data-testid="task-list" /> },
}))
vi.mock('../features/schedule/components/SchedulePanel', () => ({
  default: (props) => { lastSchedulePanelProps = props; return <div data-testid="schedule-panel" /> },
}))

const t = { generateSchedule: 'Generate Schedule' }

let onGenerateSchedule

beforeEach(() => {
  onGenerateSchedule = vi.fn()
  lastSummaryCardProps = {}
  lastTaskListProps = {}
  lastSchedulePanelProps = {}
})

const baseProps = (overrides = {}) => ({
  total: 5,
  completed: 2,
  remaining: 3,
  progress: 40,
  tasks: [],
  onToggle: vi.fn(),
  onDelete: vi.fn(),
  onStopRecurring: vi.fn(),
  excludedTaskIds: new Set(),
  onToggleSelect: vi.fn(),
  onOpenTimer: vi.fn(),
  onSaveToBank: vi.fn(),
  onOpenSavedList: vi.fn(),
  savedListTexts: new Set(),
  onReorder: vi.fn(),
  onEdit: vi.fn(),
  onGenerateSchedule,
  schedule: null,
  allScheduleDone: false,
  scheduleTimers: {},
  runningTaskId: null,
  scheduleSensors: [],
  onScheduleDragEnd: vi.fn(),
  onOpenScheduleTimer: vi.fn(),
  onMarkScheduleDone: vi.fn(),
  onRemoveScheduleItem: vi.fn(),
  onSaveSchedule: vi.fn(),
  onDeleteSchedule: vi.fn(),
  t,
  ...overrides,
})

describe('SummaryCard', () => {
  it('renders with the correct stat props', () => {
    render(<MainContent {...baseProps({ total: 10, completed: 4, remaining: 6, progress: 40 })} />)
    expect(screen.getByTestId('summary-card')).toBeTruthy()
    expect(lastSummaryCardProps.total).toBe(10)
    expect(lastSummaryCardProps.completed).toBe(4)
    expect(lastSummaryCardProps.remaining).toBe(6)
    expect(lastSummaryCardProps.progress).toBe(40)
  })
})

describe('TaskList', () => {
  it('renders and receives the tasks prop', () => {
    const tasks = [{ id: 't1', text: 'Task 1', done: false }]
    render(<MainContent {...baseProps({ tasks })} />)
    expect(screen.getByTestId('task-list')).toBeTruthy()
    expect(lastTaskListProps.tasks).toBe(tasks)
  })

  it('passes onToggle, onDelete, and onEdit callbacks', () => {
    const onToggle = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    render(<MainContent {...baseProps({ onToggle, onDelete, onEdit })} />)
    expect(lastTaskListProps.onToggle).toBe(onToggle)
    expect(lastTaskListProps.onDelete).toBe(onDelete)
    expect(lastTaskListProps.onEdit).toBe(onEdit)
  })
})

describe('Generate Schedule button', () => {
  it('shows the button when tasks array is non-empty', () => {
    render(<MainContent {...baseProps({ tasks: [{ id: 't1', text: 'Task 1', done: false }] })} />)
    expect(screen.getByText('Generate Schedule')).toBeTruthy()
  })

  it('hides the button when tasks array is empty', () => {
    render(<MainContent {...baseProps({ tasks: [] })} />)
    expect(screen.queryByText('Generate Schedule')).toBeNull()
  })

  it('calls onGenerateSchedule when clicked', () => {
    render(<MainContent {...baseProps({ tasks: [{ id: 't1', text: 'Task 1', done: false }] })} />)
    fireEvent.click(screen.getByText('Generate Schedule'))
    expect(onGenerateSchedule).toHaveBeenCalledOnce()
  })
})

describe('SchedulePanel', () => {
  it('renders SchedulePanel when schedule prop is provided', () => {
    const schedule = [{ id: 's1', text: 'Item 1', done: false }]
    render(<MainContent {...baseProps({ schedule })} />)
    expect(screen.getByTestId('schedule-panel')).toBeTruthy()
  })

  it('does not render SchedulePanel when schedule is null', () => {
    render(<MainContent {...baseProps({ schedule: null })} />)
    expect(screen.queryByTestId('schedule-panel')).toBeNull()
  })

  it('passes the schedule and related props to SchedulePanel', () => {
    const schedule = [{ id: 's1', text: 'Item 1', done: false }]
    const scheduleTimers = { s1: 120 }
    render(<MainContent {...baseProps({ schedule, scheduleTimers })} />)
    expect(lastSchedulePanelProps.schedule).toBe(schedule)
    expect(lastSchedulePanelProps.scheduleTimers).toBe(scheduleTimers)
  })
})
