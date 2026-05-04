import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import App from './App'
import { useTasks } from './features/tasks/hooks/useTasks'
import { useRecurringTasks, appliesToDate } from './features/tasks/hooks/useRecurringTasks'
import { useTaskBank } from './features/tasks/hooks/useTaskBank'
import { useColumnLayout } from './features/dashboard/hooks/useColumnLayout'
import { useTimer } from './features/schedule/hooks/useTimer'
import { useSchedule } from './features/schedule/hooks/useSchedule'
import { useTaskModal } from './features/tasks/hooks/useTaskModal'
import { useDataPortability } from './shared/hooks/useDataPortability'
import { useTimerActions } from './features/schedule/hooks/useTimerActions'
import { useTaskActions } from './features/tasks/hooks/useTaskActions'
import { buildSidebarSections } from './layout/sidebarSections'

// ── dnd-kit stubs ──────────────────────────────────────────────────────────────
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => children,
  closestCenter: vi.fn(),
}))
vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => children,
  verticalListSortingStrategy: vi.fn(),
}))

// ── layout component stubs — capture props for assertion ──────────────────────
let lastMainContentProps = {}
let lastAppModalsProps = {}

vi.mock('./layout/TopBar', () => ({ default: () => null }))
vi.mock('./layout/BottomBar', () => ({ default: () => null }))
vi.mock('./layout/MainContent', () => ({
  default: (props) => { lastMainContentProps = props; return null },
}))
vi.mock('./layout/AppModals', () => ({
  default: (props) => { lastAppModalsProps = props; return null },
}))
vi.mock('./layout/SortableSection', () => ({
  default: ({ children }) => children ?? null,
}))
vi.mock('./layout/sidebarSections', () => ({ buildSidebarSections: vi.fn(() => ({})) }))

// ── utility stubs ──────────────────────────────────────────────────────────────
vi.mock('./shared/utils/dataPortability', () => ({ exportData: vi.fn() }))
vi.mock('./shared/utils/id', () => ({ generateId: vi.fn(() => 'gen-id') }))
vi.mock('./features/schedule/utils/migrateScheduleStorage', () => ({ runMigrations: vi.fn() }))
vi.mock('./features/calendar/utils/markDateWithTasks', () => ({
  markDateWithTasks: vi.fn(() => () => null),
}))

// ── hook stubs ─────────────────────────────────────────────────────────────────
vi.mock('./shared/i18n/LangContext', () => ({
  useLang: vi.fn(() => ({
    lang: 'en',
    setLang: vi.fn(),
    t: { allDoneNothing: 'All done — nothing left!' },
  })),
}))
vi.mock('./features/tasks/hooks/useTasks', () => ({ useTasks: vi.fn() }))
vi.mock('./features/tasks/hooks/useRecurringTasks', () => ({
  useRecurringTasks: vi.fn(),
  appliesToDate: vi.fn(() => true),
}))
vi.mock('./features/tasks/hooks/useTaskBank', () => ({ useTaskBank: vi.fn() }))
vi.mock('./features/music/hooks/useMusicPlayer', () => ({ useMusicPlayer: vi.fn(() => ({})) }))
vi.mock('./features/dashboard/hooks/useColumnLayout', () => ({ useColumnLayout: vi.fn() }))
vi.mock('./features/schedule/hooks/useTimer', () => ({ useTimer: vi.fn() }))
vi.mock('./features/schedule/hooks/useSchedule', () => ({ useSchedule: vi.fn() }))
vi.mock('./features/tasks/hooks/useTaskModal', () => ({ useTaskModal: vi.fn() }))
vi.mock('./shared/hooks/useDataPortability', () => ({ useDataPortability: vi.fn() }))
vi.mock('./features/schedule/hooks/useTimerActions', () => ({ useTimerActions: vi.fn() }))
vi.mock('./features/tasks/hooks/useTaskActions', () => ({ useTaskActions: vi.fn() }))

// ── default mock factories ─────────────────────────────────────────────────────
const TODAY = new Date().toLocaleDateString('en-CA')

const mkTasks = (o = {}) => ({
  tasks: {}, addTask: vi.fn(), addTaskDirect: vi.fn(), toggleTask: vi.fn(),
  markTaskDone: vi.fn(), deleteTask: vi.fn(), editTask: vi.fn(),
  linkRecurring: vi.fn(), deleteAllByRecurringId: vi.fn(), moveTask: vi.fn(),
  reorderTasks: vi.fn(), clearAllTasks: vi.fn(), ...o,
})
const mkRecurring = (o = {}) => ({
  recurringTasks: [], addRecurring: vi.fn(), updateRecurring: vi.fn(),
  deleteRecurring: vi.fn(), clearAllRecurring: vi.fn(), ...o,
})
const mkTimer = (o = {}) => ({
  timerTask: null, isTimerMinimized: false, setIsTimerMinimized: vi.fn(),
  runningTaskId: null, setRunningTaskId: vi.fn(),
  scheduleTimers: {}, setScheduleTimers: vi.fn(), taskAllocations: {},
  pendingTimerTask: null, setPendingTimerTask: vi.fn(),
  pendingTimerMinutes: 0, setPendingTimerMinutes: vi.fn(),
  pendingSwitchTask: null, setPendingSwitchTask: vi.fn(),
  pomodoroEnabled: false, setPomodoroEnabled: vi.fn(),
  pomodoroMinutes: 25, pomodoroResetAt: null, pomodoroBreakCount: 0,
  openTimer: vi.fn(), confirmSwitchTask: vi.fn(), closeTimer: vi.fn(),
  markTimerTaskDone: vi.fn(), resetPomodoroState: vi.fn(),
  toggleTimer: vi.fn(), handleMainMusicToggle: vi.fn(), timerMusic: null,
  handleSetPomodoroMinutes: vi.fn(), resetTimer: vi.fn(),
  timerOriginDateKeyRef: { current: null }, ...o,
})
const mkSchedule = (o = {}) => ({
  schedule: null, setSchedule: vi.fn(), scheduleUnsaved: false,
  showUnsavedWarning: false, allScheduleDone: false,
  scheduleSensors: [], handleScheduleDragEnd: vi.fn(),
  generateSchedule: vi.fn(), checkUnsaved: vi.fn((cb) => cb()),
  saveSchedule: vi.fn(), deleteSchedule: vi.fn(),
  handleMarkScheduleItemDone: vi.fn(), handleRemoveScheduleItem: vi.fn(),
  markScheduleItemUndone: vi.fn(), removeTaskFromSchedule: vi.fn(),
  handleUnsavedSaveAndContinue: vi.fn(), handleUnsavedDiscard: vi.fn(),
  handleUnsavedCancel: vi.fn(), clearSchedule: vi.fn(), ...o,
})
const mkColumnLayout = (o = {}) => ({
  columnLayout: { left: [], right: [] }, sectionSensors: [],
  handleSectionDragStart: vi.fn(), handleSectionDragOver: vi.fn(),
  handleSectionDragEnd: vi.fn(), resetLayout: vi.fn(), isCustomLayout: false, ...o,
})
const mkModal = () => ({
  isOpen: false, setIsOpen: vi.fn(), open: vi.fn(), reset: vi.fn(),
  text: '', setText: vi.fn(), priority: false, setPriority: vi.fn(),
  recurrence: 'none', setRecurrence: vi.fn(),
  startDate: '', setStartDate: vi.fn(), endDate: '', setEndDate: vi.fn(),
  monthsAhead: 1, setMonthsAhead: vi.fn(), yearsAhead: 0, setYearsAhead: vi.fn(),
  taskId: null, isRecurringInstance: false,
  targetDate: '', setTargetDate: vi.fn(),
  image: '', setImage: vi.fn(), handleSubmit: vi.fn(),
})

beforeEach(() => {
  vi.clearAllMocks()
  lastMainContentProps = {}
  lastAppModalsProps = {}
  localStorage.clear()

  useTasks.mockReturnValue(mkTasks())
  useRecurringTasks.mockReturnValue(mkRecurring())
  useTaskBank.mockReturnValue({
    taskBank: [], addToBank: vi.fn(), removeFromBank: vi.fn(),
    updateInBank: vi.fn(), reorderBank: vi.fn(),
  })
  useTimer.mockReturnValue(mkTimer())
  useSchedule.mockReturnValue(mkSchedule())
  useColumnLayout.mockReturnValue(mkColumnLayout())
  useTaskModal.mockReturnValue(mkModal())
  useDataPortability.mockReturnValue({
    pendingImport: null, setPendingImport: vi.fn(),
    importError: '', importFileRef: { current: null },
    handleImportFileChange: vi.fn(), handleImportConfirm: vi.fn(),
  })
  useTimerActions.mockReturnValue({
    openTimerForTask: vi.fn(), restartTimer: vi.fn(), startAgainTimer: vi.fn(),
  })
  useTaskActions.mockReturnValue({
    handleDeleteTask: vi.fn(), handleStopRecurring: vi.fn(),
    handleSaveToBank: vi.fn(), handleOpenSavedList: vi.fn(), handleReorder: vi.fn(),
  })
  appliesToDate.mockReturnValue(true)
})

// ── theme persistence ──────────────────────────────────────────────────────────

describe('theme persistence', () => {
  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('studyflow_theme', 'light')
    render(<App />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('defaults to dark when localStorage has no stored theme', () => {
    render(<App />)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('writes theme back to localStorage on mount', () => {
    localStorage.setItem('studyflow_theme', 'light')
    render(<App />)
    expect(localStorage.getItem('studyflow_theme')).toBe('light')
  })
})

// ── confetti trigger ───────────────────────────────────────────────────────────

describe('confetti trigger', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('fires when allScheduleDone transitions false → true', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: false }))
    const { rerender } = render(<App />)
    expect(lastAppModalsProps.showConfetti).toBe(false)

    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    act(() => rerender(<App />))
    expect(lastAppModalsProps.showConfetti).toBe(true)
  })

  it('does not re-fire when allScheduleDone stays true across renders', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    const { rerender } = render(<App />)
    expect(lastAppModalsProps.showConfetti).toBe(true)

    act(() => vi.advanceTimersByTime(4500))
    expect(lastAppModalsProps.showConfetti).toBe(false)

    // dep unchanged — effect won't re-run, so confetti stays off
    act(() => rerender(<App />))
    expect(lastAppModalsProps.showConfetti).toBe(false)
  })

  it('clears confetti after 4500 ms', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    render(<App />)
    expect(lastAppModalsProps.showConfetti).toBe(true)

    act(() => vi.advanceTimersByTime(4500))
    expect(lastAppModalsProps.showConfetti).toBe(false)
  })

  it('confetti does not clear before 4500 ms have elapsed', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    render(<App />)

    act(() => vi.advanceTimersByTime(4499))
    expect(lastAppModalsProps.showConfetti).toBe(true)
  })

  it('refires when allScheduleDone transitions false → true a second time', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: false }))
    const { rerender } = render(<App />)

    // first transition: false → true
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    act(() => rerender(<App />))
    expect(lastAppModalsProps.showConfetti).toBe(true)

    act(() => vi.advanceTimersByTime(4500))
    expect(lastAppModalsProps.showConfetti).toBe(false)

    // reset: back to false — prevRef must clear
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: false }))
    act(() => rerender(<App />))

    // second transition: false → true
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    act(() => rerender(<App />))
    expect(lastAppModalsProps.showConfetti).toBe(true)
  })

  it('does not fire on initial render when allScheduleDone starts false', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: false }))
    render(<App />)
    expect(lastAppModalsProps.showConfetti).toBe(false)
  })
})

// ── recurring task auto-injection ──────────────────────────────────────────────

describe('recurring task auto-injection', () => {
  const template = { id: 'r1', text: 'Daily habit', priority: false }

  it('adds a missing recurring task for today', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [template] }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ id: 'gen-id', recurringId: 'r1', text: 'Daily habit', done: false }),
    )
  })

  it('skips injection when recurringId is already in today\'s tasks', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({
      addTaskDirect,
      tasks: { [TODAY]: [{ id: 'existing', recurringId: 'r1', done: false }] },
    }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [template] }))

    render(<App />)
    expect(addTaskDirect).not.toHaveBeenCalled()
  })

  it('skips injection when today is a skipped date for the template', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({
      recurringTasks: [{ ...template, skippedDates: [TODAY] }],
    }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).not.toHaveBeenCalled()
  })

  it('skips injection when appliesToDate returns false', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [template] }))
    appliesToDate.mockReturnValue(false)

    render(<App />)
    expect(addTaskDirect).not.toHaveBeenCalled()
  })

  it('passes imageUrl from the template to addTaskDirect', () => {
    const addTaskDirect = vi.fn()
    const templateWithImage = { id: 'r2', text: 'Read', priority: false, imageUrl: 'https://example.com/img.png' }
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [templateWithImage] }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ imageUrl: 'https://example.com/img.png' }),
    )
  })

  it('only injects templates that pass appliesToDate when multiple exist', () => {
    const addTaskDirect = vi.fn()
    const t1 = { id: 'r1', text: 'Applies', priority: false }
    const t2 = { id: 'r2', text: 'Skipped', priority: false }
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [t1, t2] }))
    appliesToDate.mockImplementation((tmpl) => tmpl.id === 'r1')

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledTimes(1)
    expect(addTaskDirect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recurringId: 'r1' }),
    )
  })

  it('injects when skippedDates is an empty array', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({
      recurringTasks: [{ id: 'r1', text: 'Habit', priority: false, skippedDates: [] }],
    }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledTimes(1)
  })

  it('passes priority from template to addTaskDirect', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({
      recurringTasks: [{ id: 'r1', text: 'Important', priority: true }],
    }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ priority: true }),
    )
  })

  it('injects all templates when all pass appliesToDate', () => {
    const addTaskDirect = vi.fn()
    const t1 = { id: 'r1', text: 'Habit A', priority: false }
    const t2 = { id: 'r2', text: 'Habit B', priority: false }
    useTasks.mockReturnValue(mkTasks({ addTaskDirect, tasks: {} }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [t1, t2] }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledTimes(2)
  })

  it('skips a template whose recurringId is already present even among multiple templates', () => {
    const addTaskDirect = vi.fn()
    const t1 = { id: 'r1', text: 'Already here', priority: false }
    const t2 = { id: 'r2', text: 'New one', priority: false }
    useTasks.mockReturnValue(mkTasks({
      addTaskDirect,
      tasks: { [TODAY]: [{ id: 'x', recurringId: 'r1', done: false }] },
    }))
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks: [t1, t2] }))
    appliesToDate.mockReturnValue(true)

    render(<App />)
    expect(addTaskDirect).toHaveBeenCalledTimes(1)
    expect(addTaskDirect).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ recurringId: 'r2' }),
    )
  })
})

// ── handleToggleTask ───────────────────────────────────────────────────────────

describe('handleToggleTask', () => {
  const task = { id: 't1', text: 'Math', done: false, priority: false }

  it('always calls toggleTask with dateKey and id', () => {
    const toggleTask = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] }, toggleTask }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))
    expect(toggleTask).toHaveBeenCalledWith(TODAY, 't1')
  })

  it('resets timer to full minutes when toggling an undone task that is in the schedule', () => {
    const setScheduleTimers = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] } }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [{ id: 't1', scheduledMinutes: 30 }] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))

    expect(setScheduleTimers).toHaveBeenCalled()
    const updater = setScheduleTimers.mock.calls[0][0]
    expect(updater({})).toEqual({ t1: 1800 }) // 30 * 60
  })

  it('resets timer to 0 when toggling a done task that is in the schedule', () => {
    const setScheduleTimers = vi.fn()
    const doneTask = { ...task, done: true }
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [doneTask] } }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [{ id: 't1', scheduledMinutes: 30 }] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))

    const updater = setScheduleTimers.mock.calls[0][0]
    expect(updater({})).toEqual({ t1: 0 })
  })

  it('does not update scheduleTimers when the task is not in the schedule', () => {
    const setScheduleTimers = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] } }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))
    expect(setScheduleTimers).not.toHaveBeenCalled()
  })

  it('calls toggleTask but skips scheduleTimers when schedule is null', () => {
    const toggleTask = vi.fn()
    const setScheduleTimers = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] }, toggleTask }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    // default mkSchedule() has schedule: null

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))

    expect(toggleTask).toHaveBeenCalledWith(TODAY, 't1')
    expect(setScheduleTimers).not.toHaveBeenCalled()
  })

  it('calls toggleTask even when the task id is not found in tasks', () => {
    const toggleTask = vi.fn()
    const setScheduleTimers = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [] }, toggleTask }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [{ id: 'ghost-id', scheduledMinutes: 20 }] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('ghost-id'))

    expect(toggleTask).toHaveBeenCalledWith(TODAY, 'ghost-id')
    expect(setScheduleTimers).not.toHaveBeenCalled()
  })

  it('sets timer to 0 when scheduledMinutes is 0 for an undone task', () => {
    const setScheduleTimers = vi.fn()
    const task = { id: 't1', text: 'Math', done: false, priority: false }
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] } }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [{ id: 't1', scheduledMinutes: 0 }] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))

    const updater = setScheduleTimers.mock.calls[0][0]
    expect(updater({})).toEqual({ t1: 0 })
  })

  it('preserves existing timer entries when updating a specific task', () => {
    const setScheduleTimers = vi.fn()
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [task] } }))
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    useSchedule.mockReturnValue(mkSchedule({ schedule: [{ id: 't1', scheduledMinutes: 10 }] }))

    render(<App />)
    act(() => lastMainContentProps.onToggle('t1'))

    const updater = setScheduleTimers.mock.calls[0][0]
    const existing = { other: 999 }
    expect(updater(existing)).toEqual({ other: 999, t1: 600 })
  })
})

// ── handleGenerateSchedule ─────────────────────────────────────────────────────

describe('handleGenerateSchedule', () => {
  it('shows notification and skips the bank modal when all tasks are done', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: true }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    expect(screen.getByText('All done — nothing left!')).toBeTruthy()
    expect(lastAppModalsProps.showTaskBankModal).toBeFalsy()
  })

  it('opens the task bank modal with auto-generate when tasks remain', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: false }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    expect(lastAppModalsProps.showTaskBankModal).toBe(true)
    expect(lastAppModalsProps.taskBankModalAutoGenerate).toBe(true)
  })

  it('does not show the notification when tasks remain', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: false }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    expect(screen.queryByText('All done — nothing left!')).toBeNull()
  })

  it('opens the bank modal when tasksForDay is empty (no tasks at all)', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: {} }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    // tasksForDay.length === 0 → allDone is false → bank modal, no notification
    expect(lastAppModalsProps.showTaskBankModal).toBe(true)
    expect(screen.queryByText('All done — nothing left!')).toBeNull()
  })

  it('opens the bank modal when only some tasks are done', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({
      tasks: { [TODAY]: [{ id: 't1', done: true }, { id: 't2', done: false }] },
    }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    expect(lastAppModalsProps.showTaskBankModal).toBe(true)
    expect(screen.queryByText('All done — nothing left!')).toBeNull()
  })

  it('does not open the bank modal when generateSchedule does not call its callback', () => {
    const generateSchedule = vi.fn() // callback never invoked
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: false }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    expect(lastAppModalsProps.showTaskBankModal).toBeFalsy()
  })
})

// ── handleClearAll ─────────────────────────────────────────────────────────────

describe('handleClearAll', () => {
  it('calls all five reset functions', () => {
    const clearAllTasks = vi.fn()
    const clearAllRecurring = vi.fn()
    const clearSchedule = vi.fn()
    const resetTimer = vi.fn()
    const resetLayout = vi.fn()

    useTasks.mockReturnValue(mkTasks({ clearAllTasks }))
    useRecurringTasks.mockReturnValue(mkRecurring({ clearAllRecurring }))
    useSchedule.mockReturnValue(mkSchedule({ clearSchedule }))
    useTimer.mockReturnValue(mkTimer({ resetTimer }))
    useColumnLayout.mockReturnValue(mkColumnLayout({ resetLayout }))

    render(<App />)
    act(() => lastAppModalsProps.handleClearAll())

    expect(clearAllTasks).toHaveBeenCalled()
    expect(clearAllRecurring).toHaveBeenCalled()
    expect(clearSchedule).toHaveBeenCalled()
    expect(resetTimer).toHaveBeenCalled()
    expect(resetLayout).toHaveBeenCalled()
  })

  it('closes the clear confirm dialog', () => {
    render(<App />)
    act(() => lastAppModalsProps.setShowClearConfirm(true))
    expect(lastAppModalsProps.showClearConfirm).toBe(true)

    act(() => lastAppModalsProps.handleClearAll())
    expect(lastAppModalsProps.showClearConfirm).toBe(false)
  })

  it('resets excludedTaskIds to an empty set', () => {
    render(<App />)

    // populate excludedTaskIds first
    act(() => lastMainContentProps.onToggleSelect('task-xyz'))
    expect(lastMainContentProps.excludedTaskIds.has('task-xyz')).toBe(true)

    act(() => lastAppModalsProps.handleClearAll())
    expect(lastMainContentProps.excludedTaskIds.size).toBe(0)
  })
})

// ── notification auto-dismiss ──────────────────────────────────────────────────

describe('notification auto-dismiss', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('removes the notification text after 2500 ms', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: true }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())
    expect(screen.getByText('All done — nothing left!')).toBeTruthy()

    act(() => vi.advanceTimersByTime(2500))
    expect(screen.queryByText('All done — nothing left!')).toBeNull()
  })

  it('is still visible just before 2500 ms elapses', () => {
    const generateSchedule = vi.fn((cb) => cb())
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: [{ id: 't1', done: true }] } }))
    useSchedule.mockReturnValue(mkSchedule({ generateSchedule }))

    render(<App />)
    act(() => lastMainContentProps.onGenerateSchedule())

    act(() => vi.advanceTimersByTime(2499))
    expect(screen.getByText('All done — nothing left!')).toBeTruthy()
  })
})

// ── toggleTaskSelection / excludedTaskIds ──────────────────────────────────────

describe('toggleTaskSelection', () => {
  it('adds an id to excludedTaskIds when toggled once', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    expect(lastMainContentProps.excludedTaskIds.has('task-abc')).toBe(true)
  })

  it('removes an id from excludedTaskIds when toggled twice', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    expect(lastMainContentProps.excludedTaskIds.has('task-abc')).toBe(false)
  })

  it('tracks multiple excluded ids independently', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-1'))
    act(() => lastMainContentProps.onToggleSelect('task-2'))
    expect(lastMainContentProps.excludedTaskIds.has('task-1')).toBe(true)
    expect(lastMainContentProps.excludedTaskIds.has('task-2')).toBe(true)
    expect(lastMainContentProps.excludedTaskIds.size).toBe(2)
  })

  it('removing one id does not affect others', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-1'))
    act(() => lastMainContentProps.onToggleSelect('task-2'))
    act(() => lastMainContentProps.onToggleSelect('task-1')) // remove task-1
    expect(lastMainContentProps.excludedTaskIds.has('task-1')).toBe(false)
    expect(lastMainContentProps.excludedTaskIds.has('task-2')).toBe(true)
  })

  it('starts with an empty set', () => {
    render(<App />)
    expect(lastMainContentProps.excludedTaskIds.size).toBe(0)
  })

  it('is present after an odd number of toggles (three)', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    act(() => lastMainContentProps.onToggleSelect('task-abc'))
    expect(lastMainContentProps.excludedTaskIds.has('task-abc')).toBe(true)
  })
})

// ── showCalendarCompletion persistence ─────────────────────────────────────────

describe('showCalendarCompletion persistence', () => {
  it('writes false to localStorage on mount when not previously stored', () => {
    render(<App />)
    expect(localStorage.getItem('studyflow_calendar_completion')).toBe('false')
  })

  it('reads true from localStorage and writes it back on mount', () => {
    localStorage.setItem('studyflow_calendar_completion', 'true')
    render(<App />)
    expect(localStorage.getItem('studyflow_calendar_completion')).toBe('true')
  })
})

// ── progress metrics forwarded to MainContent ──────────────────────────────────

describe('progress metrics forwarded to MainContent', () => {
  it('reports all zeros when there are no tasks for today', () => {
    render(<App />)
    expect(lastMainContentProps.total).toBe(0)
    expect(lastMainContentProps.completed).toBe(0)
    expect(lastMainContentProps.remaining).toBe(0)
    expect(lastMainContentProps.progress).toBe(0)
  })

  it('computes totals correctly for a mix of done and undone tasks', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: { [TODAY]: [{ id: 't1', done: true }, { id: 't2', done: false }, { id: 't3', done: false }] },
    }))
    render(<App />)
    expect(lastMainContentProps.total).toBe(3)
    expect(lastMainContentProps.completed).toBe(1)
    expect(lastMainContentProps.remaining).toBe(2)
  })

  it('computes 100% progress and 0 remaining when all tasks are done', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: { [TODAY]: [{ id: 't1', done: true }, { id: 't2', done: true }] },
    }))
    render(<App />)
    expect(lastMainContentProps.progress).toBe(100)
    expect(lastMainContentProps.remaining).toBe(0)
  })

  it('rounds progress to the nearest integer', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: { [TODAY]: [{ id: 't1', done: true }, { id: 't2', done: false }, { id: 't3', done: false }] },
    }))
    render(<App />)
    expect(lastMainContentProps.progress).toBe(33) // Math.round(1/3 * 100)
  })

  it('rounds up correctly at the halfway point (2/3 → 67)', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: { [TODAY]: [{ id: 't1', done: true }, { id: 't2', done: true }, { id: 't3', done: false }] },
    }))
    render(<App />)
    expect(lastMainContentProps.progress).toBe(67) // Math.round(2/3 * 100)
  })

  it('does not count tasks from other dates', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: {
        [TODAY]: [{ id: 't1', done: false }],
        '2000-01-01': [{ id: 't2', done: true }, { id: 't3', done: true }],
      },
    }))
    render(<App />)
    expect(lastMainContentProps.total).toBe(1)
    expect(lastMainContentProps.completed).toBe(0)
    expect(lastMainContentProps.progress).toBe(0)
  })
})

// ── savedListTexts forwarded to MainContent ────────────────────────────────────

describe('savedListTexts forwarded to MainContent', () => {
  it('is an empty Set when taskBank is empty', () => {
    render(<App />)
    expect(lastMainContentProps.savedListTexts).toBeInstanceOf(Set)
    expect(lastMainContentProps.savedListTexts.size).toBe(0)
  })

  it('contains every text from taskBank', () => {
    useTaskBank.mockReturnValue({
      taskBank: [{ text: 'Math' }, { text: 'Science' }],
      addToBank: vi.fn(), removeFromBank: vi.fn(), updateInBank: vi.fn(), reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.savedListTexts.has('Math')).toBe(true)
    expect(lastMainContentProps.savedListTexts.has('Science')).toBe(true)
    expect(lastMainContentProps.savedListTexts.size).toBe(2)
  })

  it('deduplicates identical bank item texts', () => {
    useTaskBank.mockReturnValue({
      taskBank: [{ text: 'Math' }, { text: 'Math' }],
      addToBank: vi.fn(), removeFromBank: vi.fn(), updateInBank: vi.fn(), reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.savedListTexts.size).toBe(1)
  })
})

// ── root background class ──────────────────────────────────────────────────────

describe('root background class', () => {
  it('applies dark background class by default', () => {
    const { container } = render(<App />)
    expect(container.firstChild.className).toContain('bg-[#0c0c1a]')
  })

  it('applies light background class when theme is light', () => {
    localStorage.setItem('studyflow_theme', 'light')
    const { container } = render(<App />)
    expect(container.firstChild.className).toContain('bg-[#f0eeff]')
  })

  it('does not apply light class when theme is dark', () => {
    const { container } = render(<App />)
    expect(container.firstChild.className).not.toContain('bg-[#f0eeff]')
  })
})

// ── excludedTaskIds resets on date change ──────────────────────────────────────

describe('excludedTaskIds resets on date change', () => {
  it('clears all excluded ids when the selected date changes', () => {
    render(<App />)

    act(() => lastMainContentProps.onToggleSelect('task-a'))
    act(() => lastMainContentProps.onToggleSelect('task-b'))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(2)

    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2000-01-01')))

    expect(lastMainContentProps.excludedTaskIds.size).toBe(0)
  })

  it('does not clear excluded ids when the same date is reselected', () => {
    render(<App />)

    act(() => lastMainContentProps.onToggleSelect('task-a'))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(1)

    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date())) // same day → same dateKey → effect doesn't re-run

    expect(lastMainContentProps.excludedTaskIds.size).toBe(1)
  })
})

// ── schedule props forwarded to MainContent ────────────────────────────────────

describe('schedule props forwarded to MainContent', () => {
  it('forwards null schedule by default', () => {
    render(<App />)
    expect(lastMainContentProps.schedule).toBeNull()
  })

  it('forwards a non-empty schedule array', () => {
    const schedule = [{ id: 't1', scheduledMinutes: 30 }, { id: 't2', scheduledMinutes: 15 }]
    useSchedule.mockReturnValue(mkSchedule({ schedule }))
    render(<App />)
    expect(lastMainContentProps.schedule).toEqual(schedule)
  })

  it('forwards an empty schedule array', () => {
    useSchedule.mockReturnValue(mkSchedule({ schedule: [] }))
    render(<App />)
    expect(lastMainContentProps.schedule).toEqual([])
  })

  it('forwards allScheduleDone: false by default', () => {
    render(<App />)
    expect(lastMainContentProps.allScheduleDone).toBe(false)
  })

  it('forwards allScheduleDone: true', () => {
    useSchedule.mockReturnValue(mkSchedule({ allScheduleDone: true }))
    render(<App />)
    expect(lastMainContentProps.allScheduleDone).toBe(true)
  })

  it('forwards empty scheduleTimers by default', () => {
    render(<App />)
    expect(lastMainContentProps.scheduleTimers).toEqual({})
  })

  it('forwards scheduleTimers with entries from useTimer', () => {
    const scheduleTimers = { t1: 600, t2: 300 }
    useTimer.mockReturnValue(mkTimer({ scheduleTimers }))
    render(<App />)
    expect(lastMainContentProps.scheduleTimers).toEqual(scheduleTimers)
  })

  it('forwards runningTaskId: null by default', () => {
    render(<App />)
    expect(lastMainContentProps.runningTaskId).toBeNull()
  })

  it('forwards a non-null runningTaskId', () => {
    useTimer.mockReturnValue(mkTimer({ runningTaskId: 'task-99' }))
    render(<App />)
    expect(lastMainContentProps.runningTaskId).toBe('task-99')
  })

  it('forwards saveSchedule as onSaveSchedule', () => {
    const saveSchedule = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ saveSchedule }))
    render(<App />)
    expect(lastMainContentProps.onSaveSchedule).toBe(saveSchedule)
  })

  it('forwards deleteSchedule as onDeleteSchedule', () => {
    const deleteSchedule = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ deleteSchedule }))
    render(<App />)
    expect(lastMainContentProps.onDeleteSchedule).toBe(deleteSchedule)
  })

  it('forwards handleMarkScheduleItemDone as onMarkScheduleDone', () => {
    const handleMarkScheduleItemDone = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleMarkScheduleItemDone }))
    render(<App />)
    expect(lastMainContentProps.onMarkScheduleDone).toBe(handleMarkScheduleItemDone)
  })

  it('forwards handleRemoveScheduleItem as onRemoveScheduleItem', () => {
    const handleRemoveScheduleItem = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleRemoveScheduleItem }))
    render(<App />)
    expect(lastMainContentProps.onRemoveScheduleItem).toBe(handleRemoveScheduleItem)
  })

  it('forwards scheduleSensors from useSchedule', () => {
    const scheduleSensors = ['sensor-a', 'sensor-b']
    useSchedule.mockReturnValue(mkSchedule({ scheduleSensors }))
    render(<App />)
    expect(lastMainContentProps.scheduleSensors).toBe(scheduleSensors)
  })

  it('forwards handleScheduleDragEnd as onScheduleDragEnd', () => {
    const handleScheduleDragEnd = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleScheduleDragEnd }))
    render(<App />)
    expect(lastMainContentProps.onScheduleDragEnd).toBe(handleScheduleDragEnd)
  })

  it('forwards openTimer as onOpenScheduleTimer', () => {
    const openTimer = vi.fn()
    useTimer.mockReturnValue(mkTimer({ openTimer }))
    render(<App />)
    expect(lastMainContentProps.onOpenScheduleTimer).toBe(openTimer)
  })
})

// ── timer props forwarded to AppModals ────────────────────────────────────────

describe('timer props forwarded to AppModals', () => {
  it('forwards timerTask: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.timerTask).toBeNull()
  })

  it('forwards a non-null timerTask', () => {
    const timerTask = { id: 't1', text: 'Math' }
    useTimer.mockReturnValue(mkTimer({ timerTask }))
    render(<App />)
    expect(lastAppModalsProps.timerTask).toEqual(timerTask)
  })

  it('forwards pendingTimerTask: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pendingTimerTask).toBeNull()
  })

  it('forwards a non-null pendingTimerTask', () => {
    const pendingTimerTask = { id: 't2', text: 'Reading' }
    useTimer.mockReturnValue(mkTimer({ pendingTimerTask }))
    render(<App />)
    expect(lastAppModalsProps.pendingTimerTask).toEqual(pendingTimerTask)
  })

  it('forwards pendingTimerMinutes: 0 by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pendingTimerMinutes).toBe(0)
  })

  it('forwards a non-zero pendingTimerMinutes', () => {
    useTimer.mockReturnValue(mkTimer({ pendingTimerMinutes: 45 }))
    render(<App />)
    expect(lastAppModalsProps.pendingTimerMinutes).toBe(45)
  })

  it('forwards pendingSwitchTask: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pendingSwitchTask).toBeNull()
  })

  it('forwards a non-null pendingSwitchTask', () => {
    const pendingSwitchTask = { id: 't3', text: 'Physics' }
    useTimer.mockReturnValue(mkTimer({ pendingSwitchTask }))
    render(<App />)
    expect(lastAppModalsProps.pendingSwitchTask).toEqual(pendingSwitchTask)
  })

  it('forwards pomodoroEnabled: false by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pomodoroEnabled).toBe(false)
  })

  it('forwards pomodoroEnabled: true', () => {
    useTimer.mockReturnValue(mkTimer({ pomodoroEnabled: true }))
    render(<App />)
    expect(lastAppModalsProps.pomodoroEnabled).toBe(true)
  })

  it('forwards pomodoroMinutes: 25 by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pomodoroMinutes).toBe(25)
  })

  it('forwards a custom pomodoroMinutes value', () => {
    useTimer.mockReturnValue(mkTimer({ pomodoroMinutes: 50 }))
    render(<App />)
    expect(lastAppModalsProps.pomodoroMinutes).toBe(50)
  })

  it('forwards pomodoroResetAt: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pomodoroResetAt).toBeNull()
  })

  it('forwards a non-null pomodoroResetAt timestamp', () => {
    useTimer.mockReturnValue(mkTimer({ pomodoroResetAt: 1234567890 }))
    render(<App />)
    expect(lastAppModalsProps.pomodoroResetAt).toBe(1234567890)
  })

  it('forwards pomodoroBreakCount: 0 by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pomodoroBreakCount).toBe(0)
  })

  it('forwards a non-zero pomodoroBreakCount', () => {
    useTimer.mockReturnValue(mkTimer({ pomodoroBreakCount: 3 }))
    render(<App />)
    expect(lastAppModalsProps.pomodoroBreakCount).toBe(3)
  })

  it('forwards timerMusic: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.timerMusic).toBeNull()
  })

  it('forwards a non-null timerMusic object', () => {
    const timerMusic = { src: 'lofi.mp3', playing: true }
    useTimer.mockReturnValue(mkTimer({ timerMusic }))
    render(<App />)
    expect(lastAppModalsProps.timerMusic).toEqual(timerMusic)
  })
})

// ── handleDateChange ───────────────────────────────────────────────────────────

describe('handleDateChange', () => {
  it('delegates to checkUnsaved', () => {
    const checkUnsaved = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ checkUnsaved }))
    render(<App />)
    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2025-06-15')))
    expect(checkUnsaved).toHaveBeenCalledWith(expect.any(Function))
  })

  it('updates dateKey when checkUnsaved invokes its callback', () => {
    render(<App />) // default mkSchedule checkUnsaved immediately calls cb
    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2000-01-01')))
    expect(lastAppModalsProps.dateKey).toBe('2000-01-01')
  })

  it('does not update dateKey when checkUnsaved swallows the callback', () => {
    const checkUnsaved = vi.fn() // never calls cb
    useSchedule.mockReturnValue(mkSchedule({ checkUnsaved }))
    render(<App />)
    const todayKey = new Date().toLocaleDateString('en-CA')
    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2000-01-01')))
    expect(lastAppModalsProps.dateKey).toBe(todayKey)
  })

  it('resets excludedTaskIds when the date successfully changes', () => {
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-x'))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(1)

    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2000-01-01')))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(0)
  })

  it('does not reset excludedTaskIds when checkUnsaved blocks the change', () => {
    const checkUnsaved = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ checkUnsaved }))
    render(<App />)
    act(() => lastMainContentProps.onToggleSelect('task-x'))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(1)

    const { handleDateChange } = buildSidebarSections.mock.calls.at(-1)[0]
    act(() => handleDateChange(new Date('2000-01-01')))
    expect(lastMainContentProps.excludedTaskIds.size).toBe(1)
  })
})

// ── isEditing derivation ───────────────────────────────────────────────────────

describe('isEditing derivation', () => {
  it('is false when editModal.isOpen is false', () => {
    render(<App />)
    expect(lastAppModalsProps.isEditing).toBe(false)
  })

  it('is true when editModal.isOpen is true', () => {
    useTaskModal.mockImplementation(({ mode }) =>
      mode === 'edit' ? { ...mkModal(), isOpen: true } : mkModal()
    )
    render(<App />)
    expect(lastAppModalsProps.isEditing).toBe(true)
  })

  it('stays false when only addModal.isOpen is true', () => {
    useTaskModal.mockImplementation(({ mode }) =>
      mode === 'add' ? { ...mkModal(), isOpen: true } : mkModal()
    )
    render(<App />)
    expect(lastAppModalsProps.isEditing).toBe(false)
  })
})

// ── showHelp state ─────────────────────────────────────────────────────────────

describe('showHelp state', () => {
  it('starts as false', () => {
    render(<App />)
    expect(lastAppModalsProps.showHelp).toBe(false)
  })

  it('becomes true when setShowHelp(true) is called', () => {
    render(<App />)
    act(() => lastAppModalsProps.setShowHelp(true))
    expect(lastAppModalsProps.showHelp).toBe(true)
  })

  it('returns to false after setShowHelp(false)', () => {
    render(<App />)
    act(() => lastAppModalsProps.setShowHelp(true))
    act(() => lastAppModalsProps.setShowHelp(false))
    expect(lastAppModalsProps.showHelp).toBe(false)
  })
})

// ── buildSidebarSections receives correct props ────────────────────────────────

describe('buildSidebarSections receives correct props', () => {
  it('receives default totalStudyTime of 4 and priorityPercent of 40', () => {
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.totalStudyTime).toBe(4)
    expect(props.priorityPercent).toBe(40)
  })

  it('receives tasksForDay matching today\'s task list', () => {
    const todayTasks = [{ id: 't1', done: false }, { id: 't2', done: true }]
    useTasks.mockReturnValue(mkTasks({ tasks: { [TODAY]: todayTasks } }))
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.tasksForDay).toEqual(todayTasks)
  })

  it('receives an empty tasksForDay when no tasks exist for today', () => {
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.tasksForDay).toEqual([])
  })

  it('does not include tasks from other dates in tasksForDay', () => {
    useTasks.mockReturnValue(mkTasks({
      tasks: {
        [TODAY]: [{ id: 't1', done: false }],
        '2000-01-01': [{ id: 't2', done: true }, { id: 't3', done: true }],
      },
    }))
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.tasksForDay).toEqual([{ id: 't1', done: false }])
  })

  it('receives scheduleTimers and taskAllocations from useTimer', () => {
    const scheduleTimers = { t1: 300 }
    const taskAllocations = { t1: 5 }
    useTimer.mockReturnValue(mkTimer({ scheduleTimers, taskAllocations }))
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.scheduleTimers).toEqual(scheduleTimers)
    expect(props.taskAllocations).toEqual(taskAllocations)
  })

  it('receives recurringTasks from useRecurringTasks', () => {
    const recurringTasks = [{ id: 'r1', text: 'Daily habit' }]
    useRecurringTasks.mockReturnValue(mkRecurring({ recurringTasks }))
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.recurringTasks).toEqual(recurringTasks)
  })

  it('receives handleMainMusicToggle from useTimer', () => {
    const handleMainMusicToggle = vi.fn()
    useTimer.mockReturnValue(mkTimer({ handleMainMusicToggle }))
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.handleMainMusicToggle).toBe(handleMainMusicToggle)
  })

  it('receives dateKey derived from selectedDate', () => {
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.dateKey).toBe(TODAY)
  })
})

// ── useTaskActions callbacks forwarded to MainContent ─────────────────────────

describe('useTaskActions callbacks forwarded to MainContent', () => {
  it('forwards handleDeleteTask as onDelete', () => {
    const handleDeleteTask = vi.fn()
    useTaskActions.mockReturnValue({
      handleDeleteTask, handleStopRecurring: vi.fn(),
      handleSaveToBank: vi.fn(), handleOpenSavedList: vi.fn(), handleReorder: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.onDelete).toBe(handleDeleteTask)
  })

  it('forwards handleStopRecurring as onStopRecurring', () => {
    const handleStopRecurring = vi.fn()
    useTaskActions.mockReturnValue({
      handleDeleteTask: vi.fn(), handleStopRecurring,
      handleSaveToBank: vi.fn(), handleOpenSavedList: vi.fn(), handleReorder: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.onStopRecurring).toBe(handleStopRecurring)
  })

  it('forwards handleSaveToBank as onSaveToBank', () => {
    const handleSaveToBank = vi.fn()
    useTaskActions.mockReturnValue({
      handleDeleteTask: vi.fn(), handleStopRecurring: vi.fn(),
      handleSaveToBank, handleOpenSavedList: vi.fn(), handleReorder: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.onSaveToBank).toBe(handleSaveToBank)
  })

  it('forwards handleOpenSavedList as onOpenSavedList', () => {
    const handleOpenSavedList = vi.fn()
    useTaskActions.mockReturnValue({
      handleDeleteTask: vi.fn(), handleStopRecurring: vi.fn(),
      handleSaveToBank: vi.fn(), handleOpenSavedList, handleReorder: vi.fn(),
    })
    render(<App />)
    expect(lastMainContentProps.onOpenSavedList).toBe(handleOpenSavedList)
  })

  it('forwards handleReorder as onReorder', () => {
    const handleReorder = vi.fn()
    useTaskActions.mockReturnValue({
      handleDeleteTask: vi.fn(), handleStopRecurring: vi.fn(),
      handleSaveToBank: vi.fn(), handleOpenSavedList: vi.fn(), handleReorder,
    })
    render(<App />)
    expect(lastMainContentProps.onReorder).toBe(handleReorder)
  })
})

// ── useTimerActions callbacks forwarded to MainContent and AppModals ──────────

describe('useTimerActions callbacks forwarded to MainContent and AppModals', () => {
  it('forwards openTimerForTask as onOpenTimer to MainContent', () => {
    const openTimerForTask = vi.fn()
    useTimerActions.mockReturnValue({ openTimerForTask, restartTimer: vi.fn(), startAgainTimer: vi.fn() })
    render(<App />)
    expect(lastMainContentProps.onOpenTimer).toBe(openTimerForTask)
  })

  it('forwards restartTimer to AppModals', () => {
    const restartTimer = vi.fn()
    useTimerActions.mockReturnValue({ openTimerForTask: vi.fn(), restartTimer, startAgainTimer: vi.fn() })
    render(<App />)
    expect(lastAppModalsProps.restartTimer).toBe(restartTimer)
  })

  it('forwards startAgainTimer to AppModals', () => {
    const startAgainTimer = vi.fn()
    useTimerActions.mockReturnValue({ openTimerForTask: vi.fn(), restartTimer: vi.fn(), startAgainTimer })
    render(<App />)
    expect(lastAppModalsProps.startAgainTimer).toBe(startAgainTimer)
  })
})

// ── useDataPortability props forwarded to AppModals ───────────────────────────

describe('useDataPortability props forwarded to AppModals', () => {
  it('forwards pendingImport: null by default', () => {
    render(<App />)
    expect(lastAppModalsProps.pendingImport).toBeNull()
  })

  it('forwards a non-null pendingImport object', () => {
    const pendingImport = { tasks: {}, recurringTasks: [] }
    useDataPortability.mockReturnValue({
      pendingImport, setPendingImport: vi.fn(),
      importError: '', importFileRef: { current: null },
      handleImportFileChange: vi.fn(), handleImportConfirm: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.pendingImport).toBe(pendingImport)
  })

  it('forwards setPendingImport', () => {
    const setPendingImport = vi.fn()
    useDataPortability.mockReturnValue({
      pendingImport: null, setPendingImport,
      importError: '', importFileRef: { current: null },
      handleImportFileChange: vi.fn(), handleImportConfirm: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.setPendingImport).toBe(setPendingImport)
  })

  it('forwards a non-empty importError string', () => {
    useDataPortability.mockReturnValue({
      pendingImport: null, setPendingImport: vi.fn(),
      importError: 'Corrupt file', importFileRef: { current: null },
      handleImportFileChange: vi.fn(), handleImportConfirm: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.importError).toBe('Corrupt file')
  })

  it('forwards importFileRef by reference', () => {
    const importFileRef = { current: null }
    useDataPortability.mockReturnValue({
      pendingImport: null, setPendingImport: vi.fn(),
      importError: '', importFileRef,
      handleImportFileChange: vi.fn(), handleImportConfirm: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.importFileRef).toBe(importFileRef)
  })

  it('forwards handleImportFileChange', () => {
    const handleImportFileChange = vi.fn()
    useDataPortability.mockReturnValue({
      pendingImport: null, setPendingImport: vi.fn(),
      importError: '', importFileRef: { current: null },
      handleImportFileChange, handleImportConfirm: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.handleImportFileChange).toBe(handleImportFileChange)
  })

  it('forwards handleImportConfirm', () => {
    const handleImportConfirm = vi.fn()
    useDataPortability.mockReturnValue({
      pendingImport: null, setPendingImport: vi.fn(),
      importError: '', importFileRef: { current: null },
      handleImportFileChange: vi.fn(), handleImportConfirm,
    })
    render(<App />)
    expect(lastAppModalsProps.handleImportConfirm).toBe(handleImportConfirm)
  })
})

// ── timer action callbacks forwarded to AppModals ─────────────────────────────

describe('timer action callbacks forwarded to AppModals', () => {
  it('forwards closeTimer', () => {
    const closeTimer = vi.fn()
    useTimer.mockReturnValue(mkTimer({ closeTimer }))
    render(<App />)
    expect(lastAppModalsProps.closeTimer).toBe(closeTimer)
  })

  it('forwards toggleTimer', () => {
    const toggleTimer = vi.fn()
    useTimer.mockReturnValue(mkTimer({ toggleTimer }))
    render(<App />)
    expect(lastAppModalsProps.toggleTimer).toBe(toggleTimer)
  })

  it('forwards markTimerTaskDone', () => {
    const markTimerTaskDone = vi.fn()
    useTimer.mockReturnValue(mkTimer({ markTimerTaskDone }))
    render(<App />)
    expect(lastAppModalsProps.markTimerTaskDone).toBe(markTimerTaskDone)
  })

  it('forwards isTimerMinimized: false by default', () => {
    render(<App />)
    expect(lastAppModalsProps.isTimerMinimized).toBe(false)
  })

  it('forwards isTimerMinimized: true', () => {
    useTimer.mockReturnValue(mkTimer({ isTimerMinimized: true }))
    render(<App />)
    expect(lastAppModalsProps.isTimerMinimized).toBe(true)
  })

  it('forwards setIsTimerMinimized', () => {
    const setIsTimerMinimized = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setIsTimerMinimized }))
    render(<App />)
    expect(lastAppModalsProps.setIsTimerMinimized).toBe(setIsTimerMinimized)
  })

  it('forwards confirmSwitchTask', () => {
    const confirmSwitchTask = vi.fn()
    useTimer.mockReturnValue(mkTimer({ confirmSwitchTask }))
    render(<App />)
    expect(lastAppModalsProps.confirmSwitchTask).toBe(confirmSwitchTask)
  })

  it('forwards openTimer to AppModals', () => {
    const openTimer = vi.fn()
    useTimer.mockReturnValue(mkTimer({ openTimer }))
    render(<App />)
    expect(lastAppModalsProps.openTimer).toBe(openTimer)
  })

  it('forwards handleSetPomodoroMinutes', () => {
    const handleSetPomodoroMinutes = vi.fn()
    useTimer.mockReturnValue(mkTimer({ handleSetPomodoroMinutes }))
    render(<App />)
    expect(lastAppModalsProps.handleSetPomodoroMinutes).toBe(handleSetPomodoroMinutes)
  })

  it('forwards setPomodoroEnabled', () => {
    const setPomodoroEnabled = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setPomodoroEnabled }))
    render(<App />)
    expect(lastAppModalsProps.setPomodoroEnabled).toBe(setPomodoroEnabled)
  })

  it('forwards setPendingTimerTask', () => {
    const setPendingTimerTask = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setPendingTimerTask }))
    render(<App />)
    expect(lastAppModalsProps.setPendingTimerTask).toBe(setPendingTimerTask)
  })

  it('forwards setPendingTimerMinutes', () => {
    const setPendingTimerMinutes = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setPendingTimerMinutes }))
    render(<App />)
    expect(lastAppModalsProps.setPendingTimerMinutes).toBe(setPendingTimerMinutes)
  })

  it('forwards setPendingSwitchTask', () => {
    const setPendingSwitchTask = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setPendingSwitchTask }))
    render(<App />)
    expect(lastAppModalsProps.setPendingSwitchTask).toBe(setPendingSwitchTask)
  })

  it('forwards setScheduleTimers to AppModals', () => {
    const setScheduleTimers = vi.fn()
    useTimer.mockReturnValue(mkTimer({ setScheduleTimers }))
    render(<App />)
    expect(lastAppModalsProps.setScheduleTimers).toBe(setScheduleTimers)
  })
})

// ── unsaved-warning props forwarded to AppModals ──────────────────────────────

describe('unsaved-warning props forwarded to AppModals', () => {
  it('forwards showUnsavedWarning: false by default', () => {
    render(<App />)
    expect(lastAppModalsProps.showUnsavedWarning).toBe(false)
  })

  it('forwards showUnsavedWarning: true', () => {
    useSchedule.mockReturnValue(mkSchedule({ showUnsavedWarning: true }))
    render(<App />)
    expect(lastAppModalsProps.showUnsavedWarning).toBe(true)
  })

  it('forwards handleUnsavedSaveAndContinue', () => {
    const handleUnsavedSaveAndContinue = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleUnsavedSaveAndContinue }))
    render(<App />)
    expect(lastAppModalsProps.handleUnsavedSaveAndContinue).toBe(handleUnsavedSaveAndContinue)
  })

  it('forwards handleUnsavedDiscard', () => {
    const handleUnsavedDiscard = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleUnsavedDiscard }))
    render(<App />)
    expect(lastAppModalsProps.handleUnsavedDiscard).toBe(handleUnsavedDiscard)
  })

  it('forwards handleUnsavedCancel', () => {
    const handleUnsavedCancel = vi.fn()
    useSchedule.mockReturnValue(mkSchedule({ handleUnsavedCancel }))
    render(<App />)
    expect(lastAppModalsProps.handleUnsavedCancel).toBe(handleUnsavedCancel)
  })
})

// ── modal objects forwarded to MainContent and AppModals ──────────────────────

describe('modal objects forwarded to MainContent and AppModals', () => {
  it('forwards editModal.open as onEdit to MainContent', () => {
    const open = vi.fn()
    useTaskModal.mockImplementation(({ mode }) =>
      mode === 'edit' ? { ...mkModal(), open } : mkModal()
    )
    render(<App />)
    expect(lastMainContentProps.onEdit).toBe(open)
  })

  it('forwards the addModal object to AppModals', () => {
    const addModal = mkModal()
    useTaskModal.mockImplementation(({ mode }) =>
      mode === 'add' ? addModal : mkModal()
    )
    render(<App />)
    expect(lastAppModalsProps.addModal).toBe(addModal)
  })

  it('forwards the editModal object to AppModals', () => {
    const editModal = mkModal()
    useTaskModal.mockImplementation(({ mode }) =>
      mode === 'edit' ? editModal : mkModal()
    )
    render(<App />)
    expect(lastAppModalsProps.editModal).toBe(editModal)
  })
})

// ── AppModals task/bank props forwarded ───────────────────────────────────────

describe('AppModals task/bank props forwarded', () => {
  it('forwards the full tasks object', () => {
    const tasks = { [TODAY]: [{ id: 't1', done: false }] }
    useTasks.mockReturnValue(mkTasks({ tasks }))
    render(<App />)
    expect(lastAppModalsProps.tasks).toBe(tasks)
  })

  it('forwards addTaskDirect from useTasks', () => {
    const addTaskDirect = vi.fn()
    useTasks.mockReturnValue(mkTasks({ addTaskDirect }))
    render(<App />)
    expect(lastAppModalsProps.addTaskDirect).toBe(addTaskDirect)
  })

  it('forwards taskBank from useTaskBank', () => {
    const taskBank = [{ text: 'Math' }, { text: 'Science' }]
    useTaskBank.mockReturnValue({
      taskBank, addToBank: vi.fn(), removeFromBank: vi.fn(),
      updateInBank: vi.fn(), reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.taskBank).toBe(taskBank)
  })

  it('forwards removeFromBank from useTaskBank', () => {
    const removeFromBank = vi.fn()
    useTaskBank.mockReturnValue({
      taskBank: [], addToBank: vi.fn(), removeFromBank,
      updateInBank: vi.fn(), reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.removeFromBank).toBe(removeFromBank)
  })

  it('forwards addToBank from useTaskBank', () => {
    const addToBank = vi.fn()
    useTaskBank.mockReturnValue({
      taskBank: [], addToBank, removeFromBank: vi.fn(),
      updateInBank: vi.fn(), reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.addToBank).toBe(addToBank)
  })

  it('forwards updateInBank from useTaskBank', () => {
    const updateInBank = vi.fn()
    useTaskBank.mockReturnValue({
      taskBank: [], addToBank: vi.fn(), removeFromBank: vi.fn(),
      updateInBank, reorderBank: vi.fn(),
    })
    render(<App />)
    expect(lastAppModalsProps.updateInBank).toBe(updateInBank)
  })

  it('forwards reorderBank from useTaskBank', () => {
    const reorderBank = vi.fn()
    useTaskBank.mockReturnValue({
      taskBank: [], addToBank: vi.fn(), removeFromBank: vi.fn(),
      updateInBank: vi.fn(), reorderBank,
    })
    render(<App />)
    expect(lastAppModalsProps.reorderBank).toBe(reorderBank)
  })

  it('forwards lang from useLang', () => {
    render(<App />)
    expect(lastAppModalsProps.lang).toBe('en')
  })

  it('forwards dateKey derived from the selected date', () => {
    render(<App />)
    expect(lastAppModalsProps.dateKey).toBe(TODAY)
  })
})

// ── buildSidebarSections receives showCalendarCompletion ──────────────────────

describe('buildSidebarSections receives showCalendarCompletion', () => {
  it('receives false by default', () => {
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.showCalendarCompletion).toBe(false)
  })

  it('receives true when localStorage has studyflow_calendar_completion = "true"', () => {
    localStorage.setItem('studyflow_calendar_completion', 'true')
    render(<App />)
    const props = buildSidebarSections.mock.calls.at(-1)[0]
    expect(props.showCalendarCompletion).toBe(true)
  })
})
