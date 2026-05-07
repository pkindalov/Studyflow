import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from './Pagination'

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination page={0} totalPages={1} onPrev={vi.fn()} onNext={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when totalPages is 0', () => {
    const { container } = render(
      <Pagination page={0} totalPages={0} onPrev={vi.fn()} onNext={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows current page and total pages', () => {
    render(<Pagination page={1} totalPages={5} onPrev={vi.fn()} onNext={vi.fn()} />)
    expect(screen.getByText('2 / 5')).toBeTruthy()
  })

  it('disables Prev button on the first page', () => {
    render(<Pagination page={0} totalPages={3} onPrev={vi.fn()} onNext={vi.fn()} />)
    const [prevBtn] = screen.getAllByRole('button')
    expect(prevBtn.disabled).toBe(true)
  })

  it('enables Prev button on pages after the first', () => {
    render(<Pagination page={1} totalPages={3} onPrev={vi.fn()} onNext={vi.fn()} />)
    const [prevBtn] = screen.getAllByRole('button')
    expect(prevBtn.disabled).toBe(false)
  })

  it('disables Next button on the last page', () => {
    render(<Pagination page={2} totalPages={3} onPrev={vi.fn()} onNext={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1].disabled).toBe(true)
  })

  it('enables Next button on pages before the last', () => {
    render(<Pagination page={0} totalPages={3} onPrev={vi.fn()} onNext={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons[1].disabled).toBe(false)
  })

  it('calls onPrev when Prev is clicked', () => {
    const onPrev = vi.fn()
    render(<Pagination page={1} totalPages={3} onPrev={onPrev} onNext={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when Next is clicked', () => {
    const onNext = vi.fn()
    render(<Pagination page={0} totalPages={3} onPrev={vi.fn()} onNext={onNext} />)
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
