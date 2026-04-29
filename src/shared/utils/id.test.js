import { describe, it, expect } from 'vitest'
import { generateId } from './id'

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('generateId', () => {
  it('returns a UUID v4 formatted string', () => {
    expect(generateId()).toMatch(UUID_V4_RE)
  })

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, generateId))
    expect(ids.size).toBe(50)
  })
})
