import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuickTimerPrompt from './QuickTimerPrompt'

const t = {
  howManyMinutes: 'How many minutes do you want to work on it?',
  minUnit: 'min',
  cancel: 'Cancel',
  startTimerBtn: 'Start Timer',
}

const task = { text: 'Study Math' }

describe('content', () => {
  it('shows the task name', () => {
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByText('Study Math')).toBeTruthy()
  })

  it('shows the minutes prompt text', () => {
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByText('How many minutes do you want to work on it?')).toBeTruthy()
  })

  it('shows the current minutes value in the input', () => {
    render(<QuickTimerPrompt task={task} minutes={45} onChangeMinutes={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByRole('spinbutton').value).toBe('45')
  })
})

describe('actions', () => {
  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={vi.fn()} onCancel={onCancel} t={t} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when Start Timer is clicked', () => {
    const onConfirm = vi.fn()
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={onConfirm} onCancel={vi.fn()} t={t} />)
    fireEvent.click(screen.getByText('Start Timer'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onChangeMinutes with a clamped value on input change', () => {
    const onChangeMinutes = vi.fn()
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={onChangeMinutes} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '30' } })
    expect(onChangeMinutes).toHaveBeenCalledWith(30)
  })

  it('calls onConfirm when Enter is pressed in the input', () => {
    const onConfirm = vi.fn()
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={onConfirm} onCancel={vi.fn()} t={t} />)
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Escape is pressed in the input', () => {
    const onCancel = vi.fn()
    render(<QuickTimerPrompt task={task} minutes={25} onChangeMinutes={vi.fn()} onConfirm={vi.fn()} onCancel={onCancel} t={t} />)
    fireEvent.keyDown(screen.getByRole('spinbutton'), { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
