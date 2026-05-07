import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import Confetti from './Confetti'

const mockCtx = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
}

beforeEach(() => {
  // Prevent rAF from executing the draw loop (would be infinite in jsdom)
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(42)
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Confetti', () => {
  it('renders nothing when active is false', () => {
    const { container } = render(<Confetti active={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a canvas element when active is true', () => {
    render(<Confetti active={true} />)
    expect(document.querySelector('canvas')).toBeTruthy()
  })

  it('starts the animation loop when active is true', () => {
    render(<Confetti active={true} />)
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  it('does not start the animation loop when active is false', () => {
    render(<Confetti active={false} />)
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('cancels the animation frame on unmount', () => {
    const { unmount } = render(<Confetti active={true} />)
    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(42)
  })
})
