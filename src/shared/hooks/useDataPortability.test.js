import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataPortability } from './useDataPortability'

vi.mock('../utils/dataPortability', () => ({
  readBackupFile: vi.fn(),
  applyBackup: vi.fn(),
}))

import { readBackupFile, applyBackup } from '../utils/dataPortability'

const makeSummary = (overrides = {}) => ({
  exportedAt: '2024-01-01T00:00:00.000Z',
  keyCount: 3,
  rawData: { studyflow_theme: 'dark' },
  ...overrides,
})

const makeEvent = (file = new File(['{}'], 'backup.json')) => ({
  target: { files: [file], value: '' },
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('location', { reload: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('pendingImport starts as null', () => {
    const { result } = renderHook(() => useDataPortability())
    expect(result.current.pendingImport).toBeNull()
  })

  it('importError starts as empty string', () => {
    const { result } = renderHook(() => useDataPortability())
    expect(result.current.importError).toBe('')
  })

  it('exposes importFileRef', () => {
    const { result } = renderHook(() => useDataPortability())
    expect(result.current.importFileRef).toBeDefined()
  })
})

// ── handleImportFileChange ────────────────────────────────────────────────────

describe('handleImportFileChange', () => {
  it('does nothing if no file is selected', async () => {
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange({ target: { files: [], value: '' } }))
    expect(readBackupFile).not.toHaveBeenCalled()
    expect(result.current.pendingImport).toBeNull()
  })

  it('calls readBackupFile with the selected file', async () => {
    const file = new File(['{}'], 'backup.json')
    readBackupFile.mockResolvedValue(makeSummary())
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent(file)))
    expect(readBackupFile).toHaveBeenCalledWith(file)
  })

  it('sets pendingImport with the resolved summary', async () => {
    const summary = makeSummary()
    readBackupFile.mockResolvedValue(summary)
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    expect(result.current.pendingImport).toEqual(summary)
  })

  it('clears importError before attempting to read', async () => {
    readBackupFile.mockRejectedValueOnce(new Error('first failure'))
    const summary = makeSummary()
    readBackupFile.mockResolvedValueOnce(summary)
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    expect(result.current.importError).toBe('first failure')
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    expect(result.current.importError).toBe('')
  })

  it('sets importError when readBackupFile rejects', async () => {
    readBackupFile.mockRejectedValue(new Error('bad file'))
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    expect(result.current.importError).toBe('bad file')
  })

  it('leaves pendingImport null when readBackupFile rejects', async () => {
    readBackupFile.mockRejectedValue(new Error('bad file'))
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    expect(result.current.pendingImport).toBeNull()
  })
})

// ── handleImportConfirm ───────────────────────────────────────────────────────

describe('handleImportConfirm', () => {
  const loadSummary = async (result, summary = makeSummary()) => {
    readBackupFile.mockResolvedValue(summary)
    await act(async () => result.current.handleImportFileChange(makeEvent()))
  }

  it('does nothing if pendingImport is null', () => {
    const { result } = renderHook(() => useDataPortability())
    act(() => result.current.handleImportConfirm())
    expect(applyBackup).not.toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('calls applyBackup with pendingImport.rawData', async () => {
    const summary = makeSummary({ rawData: { studyflow_theme: 'light' } })
    const { result } = renderHook(() => useDataPortability())
    await loadSummary(result, summary)
    act(() => result.current.handleImportConfirm())
    expect(applyBackup).toHaveBeenCalledWith(summary.rawData)
  })

  it('clears pendingImport after confirm', async () => {
    const { result } = renderHook(() => useDataPortability())
    await loadSummary(result)
    act(() => result.current.handleImportConfirm())
    expect(result.current.pendingImport).toBeNull()
  })

  it('calls window.location.reload after confirm', async () => {
    const { result } = renderHook(() => useDataPortability())
    await loadSummary(result)
    act(() => result.current.handleImportConfirm())
    expect(window.location.reload).toHaveBeenCalledOnce()
  })
})

// ── setPendingImport ──────────────────────────────────────────────────────────

describe('setPendingImport', () => {
  it('can manually set pendingImport to a value', () => {
    const { result } = renderHook(() => useDataPortability())
    const data = makeSummary()
    act(() => result.current.setPendingImport(data))
    expect(result.current.pendingImport).toEqual(data)
  })

  it('can manually clear pendingImport to null', async () => {
    readBackupFile.mockResolvedValue(makeSummary())
    const { result } = renderHook(() => useDataPortability())
    await act(async () => result.current.handleImportFileChange(makeEvent()))
    act(() => result.current.setPendingImport(null))
    expect(result.current.pendingImport).toBeNull()
  })
})
