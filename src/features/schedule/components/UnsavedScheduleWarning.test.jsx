import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UnsavedScheduleWarning from './UnsavedScheduleWarning'

const t = {
  unsavedScheduleTitle: 'Unsaved schedule',
  unsavedScheduleMsg: "You have a schedule that hasn't been saved.",
  cancel: 'Cancel',
  discardAndContinue: 'Discard & Continue',
  saveAndContinue: 'Save & Continue',
}

describe('content', () => {
  it('shows the title and message', () => {
    render(<UnsavedScheduleWarning onCancel={vi.fn()} onDiscard={vi.fn()} onSaveAndContinue={vi.fn()} t={t} />)
    expect(screen.getByText('Unsaved schedule')).toBeTruthy()
    expect(screen.getByText("You have a schedule that hasn't been saved.")).toBeTruthy()
  })
})

describe('actions', () => {
  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<UnsavedScheduleWarning onCancel={onCancel} onDiscard={vi.fn()} onSaveAndContinue={vi.fn()} t={t} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('calls onDiscard when Discard & Continue is clicked', () => {
    const onDiscard = vi.fn()
    render(<UnsavedScheduleWarning onCancel={vi.fn()} onDiscard={onDiscard} onSaveAndContinue={vi.fn()} t={t} />)
    fireEvent.click(screen.getByText('Discard & Continue'))
    expect(onDiscard).toHaveBeenCalledOnce()
  })

  it('calls onSaveAndContinue when Save & Continue is clicked', () => {
    const onSaveAndContinue = vi.fn()
    render(<UnsavedScheduleWarning onCancel={vi.fn()} onDiscard={vi.fn()} onSaveAndContinue={onSaveAndContinue} t={t} />)
    fireEvent.click(screen.getByText('Save & Continue'))
    expect(onSaveAndContinue).toHaveBeenCalledOnce()
  })
})
