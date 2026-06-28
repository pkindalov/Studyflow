import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import { ScheduleSettingsSection, QuoteSection, TasksProgressSection } from './RightSidebar'
import { getDailyQuote } from '../utils/getDailyQuote'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

// ── getDailyQuote ─────────────────────────────────────────────────────────────

const quotes = [
  { text: 'Quote A', author: 'Author A' },
  { text: 'Quote B', author: 'Author B' },
  { text: 'Quote C', author: 'Author C' },
]

describe('getDailyQuote', () => {
  it('returns the first quote on January 1 (dayOfYear = 0)', () => {
    const jan1 = new Date(2025, 0, 1)
    expect(getDailyQuote(quotes, jan1)).toEqual(quotes[0])
  })

  it('returns the second quote on January 2 (dayOfYear = 1)', () => {
    const jan2 = new Date(2025, 0, 2)
    expect(getDailyQuote(quotes, jan2)).toEqual(quotes[1])
  })

  it('wraps around using modulo when dayOfYear exceeds quotes.length', () => {
    // Day index 3 % 3 = 0 → first quote
    const jan4 = new Date(2025, 0, 4)
    expect(getDailyQuote(quotes, jan4)).toEqual(quotes[0])
  })

  it('returns correct quote on Dec 31 of a non-leap year (dayOfYear = 364)', () => {
    // 2025 is not a leap year: Dec 31 = day 364; 364 % 3 = 1 → second quote
    const dec31 = new Date(2025, 11, 31)
    const result = getDailyQuote(quotes, dec31)
    expect(result).toEqual(quotes[364 % quotes.length])
  })

  it('returns correct quote on Dec 31 of a leap year (dayOfYear = 365)', () => {
    // 2024 is a leap year: Dec 31 = day 365; 365 % 3 = 2 → third quote
    const dec31leap = new Date(2024, 11, 31)
    const result = getDailyQuote(quotes, dec31leap)
    expect(result).toEqual(quotes[365 % quotes.length])
  })

  it('always returns an object with text and author fields', () => {
    const today = new Date()
    const result = getDailyQuote(quotes, today)
    expect(typeof result.text).toBe('string')
    expect(typeof result.author).toBe('string')
  })
})

// ── ScheduleSettingsSection ──────────────────────────────────────────────────

const mkSettings = (overrides = {}) => ({
  totalStudyTime: 4,
  setTotalStudyTime: vi.fn(),
  priorityPercent: 30,
  setPriorityPercent: vi.fn(),
  ...overrides,
})

describe('ScheduleSettingsSection', () => {
  it('renders the Total Study Time heading', () => {
    wrap(<ScheduleSettingsSection {...mkSettings()} />)
    expect(screen.getByText('Total Study Time')).toBeTruthy()
  })

  it('renders the Priority Time Limit heading', () => {
    wrap(<ScheduleSettingsSection {...mkSettings()} />)
    expect(screen.getByText('Priority Time Limit')).toBeTruthy()
  })

  it('displays the current study time value in the input', () => {
    wrap(<ScheduleSettingsSection {...mkSettings({ totalStudyTime: 6 })} />)
    expect(screen.getByLabelText(/Total Study Time/i).value).toBe('6')
  })

  it('displays the current priority percent value in the input', () => {
    wrap(<ScheduleSettingsSection {...mkSettings({ priorityPercent: 40 })} />)
    expect(screen.getByLabelText(/Priority Time Limit/i).value).toBe('40')
  })

  it('calls setTotalStudyTime with a number when the input changes', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setTotalStudyTime: set })} />)
    fireEvent.change(screen.getByLabelText(/Total Study Time/i), { target: { value: '8' } })
    expect(set).toHaveBeenCalledWith(8)
  })

  it('clamps study time to 1 when input goes below 1', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setTotalStudyTime: set })} />)
    fireEvent.change(screen.getByLabelText(/Total Study Time/i), { target: { value: '0' } })
    expect(set).toHaveBeenCalledWith(1)
  })

  it('clamps study time to 1 when input is negative', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setTotalStudyTime: set })} />)
    fireEvent.change(screen.getByLabelText(/Total Study Time/i), { target: { value: '-5' } })
    expect(set).toHaveBeenCalledWith(1)
  })

  it('clamps study time to 24 when input exceeds 24', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setTotalStudyTime: set })} />)
    fireEvent.change(screen.getByLabelText(/Total Study Time/i), { target: { value: '30' } })
    expect(set).toHaveBeenCalledWith(24)
  })

  it('clamps empty study time input to 1', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setTotalStudyTime: set })} />)
    fireEvent.change(screen.getByLabelText(/Total Study Time/i), { target: { value: '' } })
    expect(set).toHaveBeenCalledWith(1)
  })

  it('calls setPriorityPercent with the entered value', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setPriorityPercent: set })} />)
    fireEvent.change(screen.getByLabelText(/Priority Time Limit/i), { target: { value: '60' } })
    expect(set).toHaveBeenCalledWith(60)
  })

  it('clamps priority percent to 0 when input goes below 0', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setPriorityPercent: set })} />)
    fireEvent.change(screen.getByLabelText(/Priority Time Limit/i), { target: { value: '-5' } })
    expect(set).toHaveBeenCalledWith(0)
  })

  it('clamps priority percent to 100 when input exceeds 100', () => {
    const set = vi.fn()
    wrap(<ScheduleSettingsSection {...mkSettings({ setPriorityPercent: set })} />)
    fireEvent.change(screen.getByLabelText(/Priority Time Limit/i), { target: { value: '150' } })
    expect(set).toHaveBeenCalledWith(100)
  })
})

// ── QuoteSection ─────────────────────────────────────────────────────────────

describe('QuoteSection', () => {
  it('renders an italic quote paragraph', () => {
    const { container } = wrap(<QuoteSection />)
    const quoteEl = container.querySelector('p.italic')
    expect(quoteEl).not.toBeNull()
    expect(quoteEl.textContent.length).toBeGreaterThan(0)
  })

  it('renders an author attribution', () => {
    const { container } = wrap(<QuoteSection />)
    const authorEl = container.querySelector('span.uppercase.tracking-widest')
    expect(authorEl).not.toBeNull()
    expect(authorEl.textContent.trim().length).toBeGreaterThan(0)
  })
})

// ── TasksProgressSection ─────────────────────────────────────────────────────

describe('TasksProgressSection', () => {
  it('renders an empty-state section when both recurringTasks and tasksForDay are empty', () => {
    const { container } = wrap(
      <TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={[]} />
    )
    expect(container.querySelector('section')).not.toBeNull()
  })

  it('shows "Active Projects" heading when recurringTasks are present', () => {
    const recurring = [{ id: 'r1', text: 'Project Alpha', priority: false }]
    wrap(<TasksProgressSection tasks={{}} recurringTasks={recurring} tasksForDay={[]} />)
    expect(screen.getByText('Active Projects')).toBeTruthy()
  })

  it('renders a progress row for each recurring task', () => {
    const recurring = [
      { id: 'r1', text: 'Project Alpha', priority: false },
      { id: 'r2', text: 'Project Beta', priority: true },
    ]
    wrap(<TasksProgressSection tasks={{}} recurringTasks={recurring} tasksForDay={[]} />)
    expect(screen.getByText('Project Alpha')).toBeTruthy()
    expect(screen.getByText('Project Beta')).toBeTruthy()
  })

  it('computes 100% progress for a fully-completed recurring task', () => {
    const recurring = [{ id: 'r1', text: 'Project Alpha', priority: false }]
    const tasks = {
      '2025-01-01': [{ id: 't1', recurringId: 'r1', done: true }],
      '2025-01-02': [{ id: 't2', recurringId: 'r1', done: true }],
    }
    wrap(<TasksProgressSection tasks={tasks} recurringTasks={recurring} tasksForDay={[]} />)
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('shows "Today\'s Tasks" label when only tasksForDay are present', () => {
    const tasks = [{ id: 't1', text: 'Study math', done: false, priority: false }]
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    expect(screen.getAllByText("Today's Tasks").length).toBeGreaterThan(0)
  })

  it('renders a progress bar at 100% width for a done task', () => {
    const tasks = [{ id: 't1', text: 'Study math', done: true, priority: false }]
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    const bars = document.querySelectorAll('[style*="width: 100%"]')
    expect(bars.length).toBeGreaterThan(0)
  })

  it('uses timer data to compute in-progress percentage for a running task', () => {
    // 30s elapsed out of 60s allocation → 50%
    const tasks = [{ id: 't1', text: 'Study math', done: false, priority: false }]
    wrap(
      <TasksProgressSection
        tasks={{}}
        recurringTasks={[]}
        tasksForDay={tasks}
        scheduleTimers={{ t1: 30 }}
        taskAllocations={{ t1: 1 }}
      />
    )
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
  })

  it('shows the overflow "view all" button when items exceed MAX_VISIBLE (5)', () => {
    // 6 tasks → items = [summary, t0…t5] = 7 → overflow = 2
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`, text: `Task ${i + 1}`, done: false, priority: false,
    }))
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    expect(screen.getByText(/more — view all/)).toBeTruthy()
  })

  it('opens the modal when the overflow button is clicked', () => {
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`, text: `Task ${i + 1}`, done: false, priority: false,
    }))
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    fireEvent.click(screen.getByText(/more — view all/))
    // Modal renders an h2 (vs section's h3), so there are now multiple headings
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(1)
  })

  it('closes the modal when the close button is clicked', () => {
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`, text: `Task ${i + 1}`, done: false, priority: false,
    }))
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    const headingsBefore = screen.getAllByRole('heading').length

    fireEvent.click(screen.getByText(/more — view all/))
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(headingsBefore)

    // The modal close button contains icon text "close"
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.getAllByRole('heading').length).toBe(headingsBefore)
  })

  it('enables pagination in the modal when items exceed one page (5)', () => {
    // 6 tasks → 7 items → 2 pages → Next button enabled
    const tasks = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`, text: `Task ${i + 1}`, done: false, priority: false,
    }))
    wrap(<TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={tasks} />)
    fireEvent.click(screen.getByText(/more — view all/))
    const buttons = screen.getAllByRole('button')
    const nextBtn = buttons[buttons.length - 1]
    expect(nextBtn.disabled).toBe(false)
  })
})
