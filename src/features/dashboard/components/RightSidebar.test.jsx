import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import { StudyTimeSection, PrioritySection, QuoteSection, TasksProgressSection } from './RightSidebar'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

// ── StudyTimeSection ─────────────────────────────────────────────────────────

describe('StudyTimeSection', () => {
  it('renders the heading', () => {
    wrap(<StudyTimeSection totalStudyTime={4} setTotalStudyTime={vi.fn()} />)
    expect(screen.getByText('Total Study Time')).toBeTruthy()
  })

  it('displays the current value in the input', () => {
    wrap(<StudyTimeSection totalStudyTime={6} setTotalStudyTime={vi.fn()} />)
    expect(screen.getByRole('spinbutton').value).toBe('6')
  })

  it('calls setTotalStudyTime with a number when the input changes', () => {
    const set = vi.fn()
    wrap(<StudyTimeSection totalStudyTime={4} setTotalStudyTime={set} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8' } })
    expect(set).toHaveBeenCalledWith(8)
  })
})

// ── PrioritySection ──────────────────────────────────────────────────────────

describe('PrioritySection', () => {
  it('renders the heading', () => {
    wrap(<PrioritySection priorityPercent={40} setPriorityPercent={vi.fn()} />)
    expect(screen.getByText('Priority Time Limit')).toBeTruthy()
  })

  it('displays the current value in the input', () => {
    wrap(<PrioritySection priorityPercent={40} setPriorityPercent={vi.fn()} />)
    expect(screen.getByRole('spinbutton').value).toBe('40')
  })

  it('calls setPriorityPercent with the entered value', () => {
    const set = vi.fn()
    wrap(<PrioritySection priorityPercent={40} setPriorityPercent={set} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '60' } })
    expect(set).toHaveBeenCalledWith(60)
  })

  it('clamps value to 0 when input goes below 0', () => {
    const set = vi.fn()
    wrap(<PrioritySection priorityPercent={40} setPriorityPercent={set} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-5' } })
    expect(set).toHaveBeenCalledWith(0)
  })

  it('clamps value to 100 when input exceeds 100', () => {
    const set = vi.fn()
    wrap(<PrioritySection priorityPercent={40} setPriorityPercent={set} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '150' } })
    expect(set).toHaveBeenCalledWith(100)
  })
})

// ── QuoteSection ─────────────────────────────────────────────────────────────

describe('QuoteSection', () => {
  it('renders the quote text', () => {
    wrap(<QuoteSection />)
    expect(screen.getByText(/The secret of getting ahead/)).toBeTruthy()
  })

  it('renders the author', () => {
    wrap(<QuoteSection />)
    expect(screen.getByText('Mark Twain')).toBeTruthy()
  })
})

// ── TasksProgressSection ─────────────────────────────────────────────────────

describe('TasksProgressSection', () => {
  it('renders nothing when both recurringTasks and tasksForDay are empty', () => {
    const { container } = wrap(
      <TasksProgressSection tasks={{}} recurringTasks={[]} tasksForDay={[]} />
    )
    expect(container.querySelector('section')).toBeNull()
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
