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
