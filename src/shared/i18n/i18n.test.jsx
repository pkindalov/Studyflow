import { describe, it, expect } from 'vitest'
import { en } from './en.jsx'
import { bg } from './bg.jsx'

const enKeys = Object.keys(en)
const bgKeys = Object.keys(bg)

// ── key parity ─────────────────────────────────────────────────────────────────

describe('key parity between en and bg', () => {
  it('bg contains every key that en has', () => {
    const missing = enKeys.filter((k) => !bgKeys.includes(k))
    expect(missing).toEqual([])
  })

  it('en contains every key that bg has — no bg-only extras', () => {
    const extra = bgKeys.filter((k) => !enKeys.includes(k))
    expect(extra).toEqual([])
  })

  it('all string-valued en keys are also strings in bg', () => {
    const stringKeys = enKeys.filter((k) => typeof en[k] === 'string')
    const wrongType = stringKeys.filter((k) => typeof bg[k] !== 'string')
    expect(wrongType).toEqual([])
  })

  it('all function-valued en keys are also functions in bg', () => {
    const fnKeys = enKeys.filter((k) => typeof en[k] === 'function')
    const wrongType = fnKeys.filter((k) => typeof bg[k] !== 'function')
    expect(wrongType).toEqual([])
  })
})

// ── function arity parity ──────────────────────────────────────────────────────

describe('function arity parity between en and bg', () => {
  it('every function-valued key has the same parameter count in both locales', () => {
    const fnKeys = enKeys.filter((k) => typeof en[k] === 'function')
    const mismatched = fnKeys.filter((k) => en[k].length !== bg[k].length)
    expect(mismatched).toEqual([])
  })
})
