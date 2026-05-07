import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ClearAllConfirm from './ClearAllConfirm'
import { en as t } from '../i18n/en'

const setup = (overrides = {}) =>
  render(<ClearAllConfirm onCancel={vi.fn()} onConfirm={vi.fn()} t={t} {...overrides} />)

describe('ClearAllConfirm', () => {
  it('renders the title', () => {
    setup()
    expect(screen.getByText(t.clearAllDataTitle)).toBeTruthy()
  })

  it('renders the warning message', () => {
    setup()
    expect(screen.getByText(t.clearWarningMsg)).toBeTruthy()
  })

  it('renders all four bullet items', () => {
    setup()
    expect(screen.getByText(t.clearItem1)).toBeTruthy()
    expect(screen.getByText(t.clearItem2)).toBeTruthy()
    expect(screen.getByText(t.clearItem3)).toBeTruthy()
    expect(screen.getByText(t.clearItem4)).toBeTruthy()
  })

  it('renders the cannot-undo notice', () => {
    setup()
    expect(screen.getByText(t.cannotUndo)).toBeTruthy()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    setup({ onCancel })
    fireEvent.click(screen.getByText(t.cancel))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onConfirm when Cancel is clicked', () => {
    const onConfirm = vi.fn()
    setup({ onConfirm })
    fireEvent.click(screen.getByText(t.cancel))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm when the delete button is clicked', () => {
    const onConfirm = vi.fn()
    setup({ onConfirm })
    fireEvent.click(screen.getByText(t.clearConfirmBtn))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when the delete button is clicked', () => {
    const onCancel = vi.fn()
    setup({ onCancel })
    fireEvent.click(screen.getByText(t.clearConfirmBtn))
    expect(onCancel).not.toHaveBeenCalled()
  })
})
