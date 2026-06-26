import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppModals from './AppModals'

// ── mock all child modals ──────────────────────────────────────────────────────
vi.mock('../features/schedule/components/TimerModal', () => ({
  default: ({ task }) => <div data-testid="timer-modal">{task.text}</div>,
}))
vi.mock('../features/schedule/components/MinimizedTimer', () => ({
  default: ({ task }) => <div data-testid="minimized-timer">{task.text}</div>,
}))
vi.mock('../features/schedule/components/QuickTimerPrompt', () => ({
  default: ({ task }) => <div data-testid="quick-timer-prompt">{task.text}</div>,
}))
vi.mock('../features/tasks/components/TaskBankModal', () => ({
  default: () => <div data-testid="task-bank-modal" />,
}))
vi.mock('../features/tasks/components/TaskModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="task-modal" /> : null,
}))
vi.mock('../shared/components/HelpModal', () => ({
  default: () => <div data-testid="help-modal" />,
}))
vi.mock('../shared/components/Confetti', () => ({
  default: () => null,
}))
vi.mock('../shared/components/ImportConfirmDialog', () => ({
  default: () => <div data-testid="import-confirm-dialog" />,
}))
vi.mock('../features/schedule/components/SwitchTaskDialog', () => ({
  default: () => <div data-testid="switch-task-dialog" />,
}))
vi.mock('../features/schedule/components/UnsavedScheduleWarning', () => ({
  default: () => <div data-testid="unsaved-warning" />,
}))
vi.mock('../shared/components/ClearAllConfirm', () => ({
  default: () => <div data-testid="clear-confirm" />,
}))
vi.mock('../shared/utils/id', () => ({ generateId: vi.fn(() => 'gen-id') }))

const timerTask = { id: 'tt1', text: 'Running Task', scheduledMinutes: 25 }

const modalStub = () => ({
  isOpen: false,
  reset: vi.fn(),
  handleSubmit: vi.fn(),
  text: '',
  setText: vi.fn(),
  image: '',
  setImage: vi.fn(),
  priority: false,
  setPriority: vi.fn(),
  recurrence: 'none',
  setRecurrence: vi.fn(),
  handleSetRecurrence: vi.fn(),
  dateMode: 'single',
  setDateMode: vi.fn(),
  handleSetDateMode: vi.fn(),
  startDate: '',
  setStartDate: vi.fn(),
  endDate: '',
  setEndDate: vi.fn(),
  monthsAhead: 3,
  setMonthsAhead: vi.fn(),
  yearsAhead: 1,
  setYearsAhead: vi.fn(),
  isRecurringInstance: false,
  targetDate: '',
  setTargetDate: vi.fn(),
})

const defaultProps = () => ({
  timerTask: null,
  isTimerMinimized: false,
  setIsTimerMinimized: vi.fn(),
  scheduleTimers: {},
  runningTaskId: null,
  toggleTimer: vi.fn(),
  closeTimer: vi.fn(),
  restartTimer: vi.fn(),
  startAgainTimer: vi.fn(),
  markTimerTaskDone: vi.fn(),
  timerMusic: null,
  pomodoroEnabled: false,
  setPomodoroEnabled: vi.fn(),
  pomodoroMinutes: 25,
  handleSetPomodoroMinutes: vi.fn(),
  pomodoroResetAt: 0,
  pomodoroBreakCount: 0,
  pendingTimerTask: null,
  setPendingTimerTask: vi.fn(),
  pendingTimerMinutes: 25,
  setPendingTimerMinutes: vi.fn(),
  setScheduleTimers: vi.fn(),
  openTimer: vi.fn(),
  showTaskBankModal: false,
  setShowTaskBankModal: vi.fn(),
  taskBank: [],
  tasks: {},
  removeFromBank: vi.fn(),
  addToBank: vi.fn(),
  updateInBank: vi.fn(),
  reorderBank: vi.fn(),
  taskBankModalAutoGenerate: false,
  addTaskDirect: vi.fn(),
  dateKey: '2025-06-01',
  onGenerateSchedule: vi.fn(),
  addModal: modalStub(),
  editModal: modalStub(),
  isEditing: false,
  showHelp: false,
  setShowHelp: vi.fn(),
  showConfetti: false,
  pendingImport: null,
  setPendingImport: vi.fn(),
  importError: null,
  importFileRef: { current: null },
  handleImportFileChange: vi.fn(),
  handleImportConfirm: vi.fn(),
  lang: 'en',
  pendingSwitchTask: null,
  setPendingSwitchTask: vi.fn(),
  confirmSwitchTask: vi.fn(),
  showUnsavedWarning: false,
  handleUnsavedCancel: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedSaveAndContinue: vi.fn(),
  showClearConfirm: false,
  setShowClearConfirm: vi.fn(),
  handleClearAll: vi.fn(),
  t: { addTaskTitle: 'Add New Task', editTaskTitle: 'Edit Task' },
})

beforeEach(() => vi.clearAllMocks())

describe('TimerModal', () => {
  it('shows TimerModal when timerTask is set and not minimized', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} isTimerMinimized={false} />)
    expect(screen.getByTestId('timer-modal')).toBeTruthy()
    expect(screen.getByText('Running Task')).toBeTruthy()
  })

  it('hides TimerModal when timerTask is null', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('timer-modal')).toBeNull()
  })

  it('hides TimerModal when minimized', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} isTimerMinimized={true} />)
    expect(screen.queryByTestId('timer-modal')).toBeNull()
  })
})

describe('MinimizedTimer', () => {
  it('shows MinimizedTimer when timerTask is set and minimized', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} isTimerMinimized={true} />)
    expect(screen.getByTestId('minimized-timer')).toBeTruthy()
  })

  it('hides MinimizedTimer when not minimized', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} isTimerMinimized={false} />)
    expect(screen.queryByTestId('minimized-timer')).toBeNull()
  })

  it('hides MinimizedTimer when timerTask is null', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('minimized-timer')).toBeNull()
  })
})

describe('QuickTimerPrompt', () => {
  it('shows QuickTimerPrompt when pendingTimerTask is set', () => {
    render(<AppModals {...defaultProps()} pendingTimerTask={{ id: 'p1', text: 'Pending Task' }} />)
    expect(screen.getByTestId('quick-timer-prompt')).toBeTruthy()
  })

  it('hides QuickTimerPrompt when pendingTimerTask is null', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('quick-timer-prompt')).toBeNull()
  })
})

describe('TaskBankModal', () => {
  it('shows TaskBankModal when showTaskBankModal is true', () => {
    render(<AppModals {...defaultProps()} showTaskBankModal={true} />)
    expect(screen.getByTestId('task-bank-modal')).toBeTruthy()
  })

  it('hides TaskBankModal when showTaskBankModal is false', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('task-bank-modal')).toBeNull()
  })
})

describe('TaskModal', () => {
  it('shows TaskModal when addModal.isOpen is true', () => {
    const addModal = { ...modalStub(), isOpen: true }
    render(<AppModals {...defaultProps()} addModal={addModal} />)
    expect(screen.getByTestId('task-modal')).toBeTruthy()
  })

  it('shows TaskModal when editModal.isOpen is true', () => {
    const editModal = { ...modalStub(), isOpen: true }
    render(<AppModals {...defaultProps()} editModal={editModal} isEditing={true} />)
    expect(screen.getByTestId('task-modal')).toBeTruthy()
  })

  it('does not show TaskModal when both modals are closed', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('task-modal')).toBeNull()
  })
})

describe('HelpModal', () => {
  it('shows HelpModal when showHelp is true', () => {
    render(<AppModals {...defaultProps()} showHelp={true} />)
    expect(screen.getByTestId('help-modal')).toBeTruthy()
  })

  it('hides HelpModal when showHelp is false', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('help-modal')).toBeNull()
  })
})

describe('ImportConfirmDialog', () => {
  it('shows ImportConfirmDialog when pendingImport is set', () => {
    render(<AppModals {...defaultProps()} pendingImport={{ exportedAt: '2025-01-01' }} />)
    expect(screen.getByTestId('import-confirm-dialog')).toBeTruthy()
  })

  it('hides ImportConfirmDialog when pendingImport is null', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('import-confirm-dialog')).toBeNull()
  })
})

describe('SwitchTaskDialog', () => {
  it('shows SwitchTaskDialog when pendingSwitchTask and timerTask are both set', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} pendingSwitchTask={{ id: 'pt1', text: 'Switch Target' }} />)
    expect(screen.getByTestId('switch-task-dialog')).toBeTruthy()
  })

  it('hides SwitchTaskDialog when timerTask is null', () => {
    render(<AppModals {...defaultProps()} pendingSwitchTask={{ id: 'pt1', text: 'Switch Target' }} />)
    expect(screen.queryByTestId('switch-task-dialog')).toBeNull()
  })

  it('hides SwitchTaskDialog when pendingSwitchTask is null', () => {
    render(<AppModals {...defaultProps()} timerTask={timerTask} />)
    expect(screen.queryByTestId('switch-task-dialog')).toBeNull()
  })
})

describe('UnsavedScheduleWarning', () => {
  it('shows UnsavedScheduleWarning when showUnsavedWarning is true', () => {
    render(<AppModals {...defaultProps()} showUnsavedWarning={true} />)
    expect(screen.getByTestId('unsaved-warning')).toBeTruthy()
  })

  it('hides UnsavedScheduleWarning when showUnsavedWarning is false', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('unsaved-warning')).toBeNull()
  })
})

describe('ClearAllConfirm', () => {
  it('shows ClearAllConfirm when showClearConfirm is true', () => {
    render(<AppModals {...defaultProps()} showClearConfirm={true} />)
    expect(screen.getByTestId('clear-confirm')).toBeTruthy()
  })

  it('hides ClearAllConfirm when showClearConfirm is false', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByTestId('clear-confirm')).toBeNull()
  })
})

describe('importError', () => {
  it('shows import error banner when importError is set', () => {
    render(<AppModals {...defaultProps()} importError="Invalid file format" />)
    expect(screen.getByText('Invalid file format')).toBeTruthy()
  })

  it('hides import error banner when importError is null', () => {
    render(<AppModals {...defaultProps()} />)
    expect(screen.queryByText('Invalid file format')).toBeNull()
  })
})
