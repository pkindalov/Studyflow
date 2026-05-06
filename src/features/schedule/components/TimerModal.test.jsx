import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import TimerModal from './TimerModal'

vi.mock('../../../shared/components/Pagination', () => ({
  default: () => null,
}))

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const task = { id: 't1', text: 'Write Essay', priority: false, scheduledMinutes: 25 }

let onPlayPause, onClose, onRestart, onStartAgain, onMarkDone, onMinimize

beforeEach(() => {
  onPlayPause = vi.fn()
  onClose = vi.fn()
  onRestart = vi.fn()
  onStartAgain = vi.fn()
  onMarkDone = vi.fn()
  onMinimize = vi.fn()
  localStorage.clear()
})

const baseProps = () => ({
  task,
  elapsedSeconds: 0,
  isRunning: false,
  onPlayPause,
  onClose,
  onRestart,
  onStartAgain,
  onMarkDone,
  onMinimize,
})

describe('content', () => {
  it('shows the task name', () => {
    wrap(<TimerModal {...baseProps()} />)
    expect(screen.getByText('Write Essay')).toBeTruthy()
  })

  it('shows remaining time when not finished', () => {
    // 25 min total, 1 s elapsed → 24:59 remaining (unique — elapsed shows 00:01, total shows 25:00)
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1} />)
    expect(screen.getByText('24:59')).toBeTruthy()
  })

  it('shows partial remaining time correctly', () => {
    // 25 min total, 5 min elapsed → 20:00
    wrap(<TimerModal {...baseProps()} elapsedSeconds={300} />)
    expect(screen.getByText('20:00')).toBeTruthy()
  })

  it('shows Done! state when timer is finished', () => {
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1500} />)
    expect(screen.getByText('Done!')).toBeTruthy()
  })

  it('shows task completed message when finished', () => {
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1500} />)
    expect(screen.getByText('Task time completed! Great work.')).toBeTruthy()
  })
})

describe('play/pause button', () => {
  it('shows play_arrow when not running', () => {
    wrap(<TimerModal {...baseProps()} isRunning={false} />)
    // play_arrow is the icon text in material-symbols
    expect(screen.getByText('play_arrow')).toBeTruthy()
  })

  it('shows pause when running', () => {
    wrap(<TimerModal {...baseProps()} isRunning={true} />)
    expect(screen.getByText('pause')).toBeTruthy()
  })

  it('calls onPlayPause when clicked', () => {
    wrap(<TimerModal {...baseProps()} />)
    fireEvent.click(screen.getByText('play_arrow'))
    expect(onPlayPause).toHaveBeenCalledOnce()
  })
})

describe('close and minimize', () => {
  it('calls onClose when close button is clicked', () => {
    wrap(<TimerModal {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows minimize button when onMinimize is provided', () => {
    wrap(<TimerModal {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeTruthy()
  })

  it('calls onMinimize when minimize button is clicked', () => {
    wrap(<TimerModal {...baseProps()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Minimize' }))
    expect(onMinimize).toHaveBeenCalledOnce()
  })

  it('hides minimize button when onMinimize is not provided', () => {
    wrap(<TimerModal {...baseProps()} onMinimize={undefined} />)
    expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull()
  })
})

describe('finished state buttons', () => {
  it('shows Start Again button when finished and onStartAgain is provided', () => {
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1500} />)
    expect(screen.getByText('Start Again')).toBeTruthy()
  })

  it('shows Restart button when finished and onRestart is provided', () => {
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1500} />)
    expect(screen.getByText('Restart from scratch')).toBeTruthy()
  })

  it('calls onStartAgain when Start Again is clicked', () => {
    wrap(<TimerModal {...baseProps()} elapsedSeconds={1500} />)
    fireEvent.click(screen.getByText('Start Again'))
    expect(onStartAgain).toHaveBeenCalledOnce()
  })
})

describe('pomodoro section', () => {
  it('shows pomodoro section when setPomodoroEnabled is provided', () => {
    wrap(<TimerModal {...baseProps()} setPomodoroEnabled={vi.fn()} pomodoroEnabled={false} pomodoroMinutes={25} />)
    expect(screen.getByText('Pomodoro')).toBeTruthy()
  })

  it('hides pomodoro section when setPomodoroEnabled is not provided', () => {
    wrap(<TimerModal {...baseProps()} />)
    expect(screen.queryByText('Pomodoro')).toBeNull()
  })
})

describe('music section', () => {
  const music = {
    playlist: [],
    activeTrackId: null,
    activeTrack: null,
    isPlaying: false,
    togglePlay: vi.fn(),
    selectTrack: vi.fn(),
  }

  it('shows music section when music prop is provided', () => {
    wrap(<TimerModal {...baseProps()} music={music} />)
    expect(screen.getByText('Music')).toBeTruthy()
  })

  it('hides music section when music prop is not provided', () => {
    wrap(<TimerModal {...baseProps()} />)
    expect(screen.queryByText('Music')).toBeNull()
  })

  it('shows empty-tracks message when playlist is empty', () => {
    wrap(<TimerModal {...baseProps()} music={music} />)
    expect(screen.getByText('No tracks — add one in the sidebar.')).toBeTruthy()
  })

  it('shows track names in compact list', () => {
    const musicWithTracks = {
      ...music,
      playlist: [
        { id: 'tr1', name: 'Lo-Fi Beats' },
        { id: 'tr2', name: 'Jazz Focus' },
      ],
      activeTrackId: 'tr1',
    }
    wrap(<TimerModal {...baseProps()} music={musicWithTracks} />)
    expect(screen.getByText('Lo-Fi Beats')).toBeTruthy()
    expect(screen.getByText('Jazz Focus')).toBeTruthy()
  })
})
