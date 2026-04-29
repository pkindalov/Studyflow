import { describe, it, expect, beforeEach } from 'vitest'
import { applyBackup } from './dataPortability'

describe('applyBackup', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('writes all rawData keys to localStorage', () => {
    applyBackup({ studyflow_tasks: '{"2024-01-01":[]}', studyflow_theme: 'dark' })
    expect(localStorage.getItem('studyflow_tasks')).toBe('{"2024-01-01":[]}')
    expect(localStorage.getItem('studyflow_theme')).toBe('dark')
  })

  it('removes existing static app keys before writing', () => {
    localStorage.setItem('studyflow_tasks', 'old-data')
    localStorage.setItem('studyflow_recurring', 'old-recurring')
    applyBackup({ studyflow_theme: 'light' })
    expect(localStorage.getItem('studyflow_tasks')).toBeNull()
    expect(localStorage.getItem('studyflow_recurring')).toBeNull()
    expect(localStorage.getItem('studyflow_theme')).toBe('light')
  })

  it('removes existing schedule_ prefixed keys before writing', () => {
    localStorage.setItem('schedule_2024-01-01', 'old')
    applyBackup({})
    expect(localStorage.getItem('schedule_2024-01-01')).toBeNull()
  })

  it('removes existing studyflow_schedule prefixed keys before writing', () => {
    localStorage.setItem('studyflow_schedules', 'old')
    applyBackup({})
    expect(localStorage.getItem('studyflow_schedules')).toBeNull()
  })

  it('does not touch unrelated localStorage keys', () => {
    localStorage.setItem('some_other_app_key', 'keep-me')
    applyBackup({})
    expect(localStorage.getItem('some_other_app_key')).toBe('keep-me')
  })

  it('handles an empty rawData object without error', () => {
    expect(() => applyBackup({})).not.toThrow()
  })
})
