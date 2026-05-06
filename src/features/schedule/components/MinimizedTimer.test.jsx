import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../../../shared/i18n/LangContext'
import MinimizedTimer from './MinimizedTimer'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

const task = { text: 'Read Chapter 5', scheduledMinutes: 30 }

let onExpand, onPlayPause

beforeEach(() => {
  onExpand = vi.fn()
  onPlayPause = vi.fn()
  localStorage.clear()
})

describe('content', () => {
  it('shows the task name', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={0} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    expect(screen.getByText('Read Chapter 5')).toBeTruthy()
  })

  it('shows remaining time in MM:SS when not finished', () => {
    // 30 min total, 0 elapsed → 30:00
    wrap(<MinimizedTimer task={task} elapsedSeconds={0} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    expect(screen.getByText('30:00')).toBeTruthy()
  })

  it('shows partial remaining time correctly', () => {
    // 30 min total, 5 min elapsed → 25:00
    wrap(<MinimizedTimer task={task} elapsedSeconds={300} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    expect(screen.getByText('25:00')).toBeTruthy()
  })

  it('shows "Done!" when timer is finished', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={1800} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    expect(screen.getByText('Done!')).toBeTruthy()
  })
})

describe('actions', () => {
  it('calls onExpand when the expand button is clicked', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={0} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    fireEvent.click(screen.getAllByTitle('Expand timer')[0])
    expect(onExpand).toHaveBeenCalled()
  })

  it('calls onPlayPause when the play/pause button is clicked', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={0} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    fireEvent.click(screen.getByTitle('Resume'))
    expect(onPlayPause).toHaveBeenCalled()
  })

  it('play/pause button shows Pause title when running', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={60} isRunning={true} onExpand={onExpand} onPlayPause={onPlayPause} />)
    expect(screen.getByTitle('Pause')).toBeTruthy()
  })

  it('play/pause button is disabled when timer is finished', () => {
    wrap(<MinimizedTimer task={task} elapsedSeconds={1800} isRunning={false} onExpand={onExpand} onPlayPause={onPlayPause} />)
    const btn = screen.getByTitle('Resume')
    expect(btn).toBeDisabled()
  })
})
