import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomBar from './BottomBar'

const t = {
  exportBtn: 'Export',
  importBtn: 'Import',
  clearBtn: 'Clear',
  resetLayoutBtn: 'Reset layout',
  exportTitle: 'Export all data as a backup file',
  importTitle: 'Restore data from a backup file',
  clearTitle: 'Permanently delete all data',
}

let onExport, onImport, onShowClearConfirm, onResetLayout

beforeEach(() => {
  onExport = vi.fn()
  onImport = vi.fn()
  onShowClearConfirm = vi.fn()
  onResetLayout = vi.fn()
})

// ── data actions ──────────────────────────────────────────────────────────────

describe('data action buttons', () => {
  it('calls onExport when Export is clicked', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    fireEvent.click(screen.getAllByText('Export')[0])
    expect(onExport).toHaveBeenCalled()
  })

  it('calls onImport when Import is clicked', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    fireEvent.click(screen.getAllByText('Import')[0])
    expect(onImport).toHaveBeenCalled()
  })

  it('calls onShowClearConfirm when Clear is clicked', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    fireEvent.click(screen.getAllByText('Clear')[0])
    expect(onShowClearConfirm).toHaveBeenCalled()
  })
})

// ── reset layout button ───────────────────────────────────────────────────────

describe('reset layout button', () => {
  it('is disabled when isCustomLayout is false', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    // Desktop button is always rendered; mobile button is conditionally rendered
    const btn = screen.getByRole('button', { name: /Reset layout/ })
    expect(btn).toBeDisabled()
  })

  it('is enabled and calls onResetLayout when isCustomLayout is true', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={true} onResetLayout={onResetLayout} t={t} />)
    fireEvent.click(screen.getAllByText('Reset layout')[0])
    expect(onResetLayout).toHaveBeenCalled()
  })

  it('only shows one desktop reset-layout button when isCustomLayout is false', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    expect(screen.getAllByText('Reset layout')).toHaveLength(1)
  })

  it('shows two reset-layout buttons (mobile + desktop) when isCustomLayout is true', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={true} onResetLayout={onResetLayout} t={t} />)
    expect(screen.getAllByText('Reset layout')).toHaveLength(2)
  })

  it('does not call onResetLayout when the desktop button is disabled', () => {
    render(<BottomBar onExport={onExport} onImport={onImport} onShowClearConfirm={onShowClearConfirm} isCustomLayout={false} onResetLayout={onResetLayout} t={t} />)
    fireEvent.click(screen.getByRole('button', { name: /Reset layout/ }))
    expect(onResetLayout).not.toHaveBeenCalled()
  })
})
