import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SortableSection from './SortableSection'

const mockUseSortable = vi.hoisted(() =>
  vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }))
)

vi.mock('@dnd-kit/sortable', () => ({ useSortable: mockUseSortable }))
vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}))

const t = { dragToMoveHint: 'Drag to move to other column' }

describe('SortableSection', () => {
  it('renders children', () => {
    render(
      <SortableSection id="section-1" t={t}>
        <span>Child content</span>
      </SortableSection>
    )
    expect(screen.getByText('Child content')).toBeTruthy()
  })

  it('renders the drag handle with the correct title', () => {
    render(
      <SortableSection id="section-1" t={t}>
        <span>Content</span>
      </SortableSection>
    )
    expect(screen.getByTitle('Drag to move to other column')).toBeTruthy()
  })

  it('renders the drag_indicator icon inside the handle', () => {
    render(
      <SortableSection id="section-1" t={t}>
        <span>Content</span>
      </SortableSection>
    )
    expect(screen.getByText('drag_indicator')).toBeTruthy()
  })

  it('applies opacity-100 class when not dragging', () => {
    const { container } = render(
      <SortableSection id="section-1" t={t}>
        <span>Content</span>
      </SortableSection>
    )
    expect(container.firstChild.className).toContain('opacity-100')
  })

  it('applies opacity-30 class when isDragging is true', () => {
    mockUseSortable.mockReturnValueOnce({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: undefined,
      isDragging: true,
    })
    const { container } = render(
      <SortableSection id="section-1" t={t}>
        <span>Content</span>
      </SortableSection>
    )
    expect(container.firstChild.className).toContain('opacity-30')
  })
})
