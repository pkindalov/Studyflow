import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SwitchTaskDialog from './SwitchTaskDialog'

const t = {
  switchTaskTitle: 'Switch task?',
  switchTaskFrom: 'Currently tracking',
  switchTaskTo: 'Switch to',
  cancel: 'Cancel',
  switchBtn: 'Switch',
}

const fromTask = { text: 'Old Task' }
const toTask = { text: 'New Task' }

describe('content', () => {
  it('shows both task names', () => {
    render(<SwitchTaskDialog fromTask={fromTask} toTask={toTask} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByText('Old Task')).toBeTruthy()
    expect(screen.getByText('New Task')).toBeTruthy()
  })

  it('shows the dialog title', () => {
    render(<SwitchTaskDialog fromTask={fromTask} toTask={toTask} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByText('Switch task?')).toBeTruthy()
  })

  it('shows from and to labels', () => {
    render(<SwitchTaskDialog fromTask={fromTask} toTask={toTask} onConfirm={vi.fn()} onCancel={vi.fn()} t={t} />)
    expect(screen.getByText('Currently tracking')).toBeTruthy()
    expect(screen.getByText('Switch to')).toBeTruthy()
  })
})

describe('actions', () => {
  it('calls onConfirm when Switch is clicked', () => {
    const onConfirm = vi.fn()
    render(<SwitchTaskDialog fromTask={fromTask} toTask={toTask} onConfirm={onConfirm} onCancel={vi.fn()} t={t} />)
    fireEvent.click(screen.getByText('Switch'))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<SwitchTaskDialog fromTask={fromTask} toTask={toTask} onConfirm={vi.fn()} onCancel={onCancel} t={t} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
