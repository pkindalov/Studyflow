import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImportConfirmDialog from './ImportConfirmDialog'
import { en as t } from '../i18n/en'

const baseProps = { exportedAt: null, lang: 'en', onCancel: vi.fn(), onConfirm: vi.fn(), t }

describe('ImportConfirmDialog', () => {
  it('renders the title', () => {
    render(<ImportConfirmDialog {...baseProps} />)
    expect(screen.getByText(t.restoreBackupTitle)).toBeTruthy()
  })

  it('shows unknownDate when exportedAt is null', () => {
    render(<ImportConfirmDialog {...baseProps} />)
    expect(screen.getByText(t.restoreConfirmFn(t.unknownDate))).toBeTruthy()
  })

  it('formats the date for en-US when exportedAt is provided', () => {
    // Compute the same formatted date the component will use so the test is timezone-safe
    const exportedAt = '2025-03-15T12:00:00.000Z'
    const formatted = new Date(exportedAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
    render(<ImportConfirmDialog {...baseProps} exportedAt={exportedAt} lang="en" />)
    expect(screen.getByText(t.restoreConfirmFn(formatted))).toBeTruthy()
  })

  it('formats the date for bg-BG when lang is "bg"', () => {
    const exportedAt = '2025-03-15T12:00:00.000Z'
    const formatted = new Date(exportedAt).toLocaleDateString('bg-BG', { dateStyle: 'medium' })
    render(<ImportConfirmDialog {...baseProps} exportedAt={exportedAt} lang="bg" />)
    expect(screen.getByText(t.restoreConfirmFn(formatted))).toBeTruthy()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    render(<ImportConfirmDialog {...baseProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText(t.cancel))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not call onConfirm when Cancel is clicked', () => {
    const onConfirm = vi.fn()
    render(<ImportConfirmDialog {...baseProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText(t.cancel))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onConfirm when Restore is clicked', () => {
    const onConfirm = vi.fn()
    render(<ImportConfirmDialog {...baseProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText(t.restore))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not call onCancel when Restore is clicked', () => {
    const onCancel = vi.fn()
    render(<ImportConfirmDialog {...baseProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText(t.restore))
    expect(onCancel).not.toHaveBeenCalled()
  })
})
