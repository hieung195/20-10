import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../api/familyApi', () => ({
  listFamilyFeedback: vi.fn().mockResolvedValue({ items: [{ id: 'reply-1', recipient: 'Mẹ', content: 'đang đi!', images: [], createdAt: '2026-10-21T01:27:05.000Z' }] }),
  sendFamilyFeedback: vi.fn(),
}))
import FamilyFeedback from './FamilyFeedback'

afterEach(cleanup)

test('shows each reply timestamp last and right aligned', async () => {
  render(<MemoryRouter><FamilyFeedback name="mẹ" recipient="Mẹ" /></MemoryRouter>)
  const reply = await screen.findByText('đang đi!')
  const article = reply.closest('article')
  expect(article.lastElementChild).toHaveClass('family-feedback__time')
  expect(article.lastElementChild.tagName).toBe('TIME')
})
