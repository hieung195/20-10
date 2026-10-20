import { act, cleanup, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/api', () => ({ default: { post: vi.fn().mockResolvedValue({}) } }))
import api from '../services/api'
import VisitTracker from './VisitTracker'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.clearAllTimers()
  vi.clearAllMocks()
})

test('records admin visits with the explicit /admin path', async () => {
  vi.useFakeTimers()
  render(<MemoryRouter initialEntries={['/admin']}><VisitTracker /></MemoryRouter>)
  await act(async () => { await vi.runOnlyPendingTimersAsync() })
  expect(api.post).toHaveBeenCalledWith('/api/visits', expect.objectContaining({ page: '/admin' }))
})

test('does not record the login page', async () => {
  vi.useFakeTimers()
  render(<MemoryRouter initialEntries={['/login']}><VisitTracker /></MemoryRouter>)
  await act(async () => { await vi.runOnlyPendingTimersAsync() })
  expect(api.post).not.toHaveBeenCalled()
})
