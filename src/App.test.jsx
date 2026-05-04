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
vi.mock('./layout/sidebarSections', () => ({ buildSidebarSections: () => ({}) }))

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
  schedule: null, showUnsavedWarning: false, allScheduleDone: false,
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
  isOpen: false, open: vi.fn(), reset: vi.fn(),
  text: '', setText: vi.fn(), priority: false, setPriority: vi.fn(),
  recurrence: 'none', setRecurrence: vi.fn(),
  startDate: '', setStartDate: vi.fn(), endDate: '', setEndDate: vi.fn(),
  targetDate: '', setTargetDate: vi.fn(),
  isRecurringInstance: false, image: '', setImage: vi.fn(), handleSubmit: vi.fn(),
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
})
