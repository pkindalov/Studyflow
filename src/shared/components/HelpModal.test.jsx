import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LangProvider } from '../i18n/LangContext'
import HelpModal from './HelpModal'

const wrap = (ui) => render(<LangProvider>{ui}</LangProvider>)

describe('header', () => {
  it('renders the modal title', () => {
    wrap(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('How Studyflow works')).toBeTruthy()
  })

  it('renders the data note in the footer', () => {
    wrap(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Data lives in your browser — no account needed.')).toBeTruthy()
  })
})

describe('section headings', () => {
  it('renders all nine section headings', () => {
    wrap(<HelpModal onClose={vi.fn()} />)
    expect(screen.getByText('Creating tasks')).toBeTruthy()
    expect(screen.getByText('Recurring tasks')).toBeTruthy()
    expect(screen.getByText('Generating a schedule')).toBeTruthy()
    expect(screen.getByText('Focus timer')).toBeTruthy()
    expect(screen.getByText('Pomodoro mode')).toBeTruthy()
    expect(screen.getByText('Focus music')).toBeTruthy()
    expect(screen.getByText('Drag & drop')).toBeTruthy()
    expect(screen.getByText('Your data & privacy')).toBeTruthy()
    expect(screen.getByText('Season themes')).toBeTruthy()
  })
})

describe('close actions', () => {
  it('calls onClose when the header close button is clicked', () => {
    const onClose = vi.fn()
    wrap(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the "Got it" footer button is clicked', () => {
    const onClose = vi.fn()
    wrap(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByText('Got it'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
