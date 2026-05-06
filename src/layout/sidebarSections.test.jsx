import { describe, it, expect, vi } from 'vitest'
import { buildSidebarSections } from './sidebarSections'

vi.mock('../features/calendar/components/CalendarSidebar', () => ({ default: () => null }))
vi.mock('../features/dashboard/components/RightSidebar', () => ({
  StudyTimeSection: () => null,
  PrioritySection: () => null,
  QuoteSection: () => null,
  TasksProgressSection: () => null,
}))
vi.mock('../features/dashboard/components/ActivityPanel', () => ({ ActivityPanel: () => null }))
vi.mock('../features/music/components/MusicPanel', () => ({ default: () => null }))

const baseArgs = () => ({
  selectedDate: new Date('2025-06-01'),
  handleDateChange: vi.fn(),
  markDateWithTasksFn: vi.fn(),
  addModal: { open: vi.fn() },
  dateKey: '2025-06-01',
  showCalendarCompletion: false,
  setShowCalendarCompletion: vi.fn(),
  tasks: {},
  totalStudyTime: 120,
  setTotalStudyTime: vi.fn(),
  priorityPercent: 30,
  setPriorityPercent: vi.fn(),
  recurringTasks: {},
  tasksForDay: [],
  scheduleTimers: {},
  taskAllocations: {},
  music: {
    playlist: [],
    activeTrackId: null,
    activeTrack: null,
    isPlaying: false,
    volume: 70,
    playbackError: null,
    selectTrack: vi.fn(),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    setVolume: vi.fn(),
    clearPlaybackError: vi.fn(),
  },
  handleMainMusicToggle: vi.fn(),
})

describe('buildSidebarSections', () => {
  it('returns an object with a calendar key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('calendar')
  })

  it('returns an object with an activity key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('activity')
  })

  it('returns an object with a studyTime key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('studyTime')
  })

  it('returns an object with a priorityPercent key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('priorityPercent')
  })

  it('returns an object with a quote key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('quote')
  })

  it('returns an object with a todaysTasks key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('todaysTasks')
  })

  it('returns an object with a music key', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(sections).toHaveProperty('music')
  })

  it('returns exactly 7 sections', () => {
    const sections = buildSidebarSections(baseArgs())
    expect(Object.keys(sections)).toHaveLength(7)
  })
})
