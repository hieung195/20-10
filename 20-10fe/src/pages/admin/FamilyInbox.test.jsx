import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../api/adminApi', () => ({ adminAuth: { getToken: () => 'test-token', clear: vi.fn() } }))
import FamilyInbox from './FamilyInbox'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test('loads the blocked IP list without crashing the overview', async () => {
  const payloads = {
    overview: { feedbackCount: 0, visitCount: 1, visitors: 1, visits: [{ id: 'visit-1', ip: '203.0.113.7', createdAt: '2026-10-21T00:00:00.000Z', page: '/', location: { label: 'Đà Nẵng' } }] },
    feedback: { items: [], total: 0 },
    greetings: { items: [] },
    images: { items: [], total: 0, totalBytes: 0 },
    'blocked-ips': { items: [{ ip: '203.0.113.9', createdAt: '2026-10-21T00:00:00.000Z' }] },
  }
  vi.stubGlobal('fetch', vi.fn(async url => {
    const key = new URL(url, 'http://localhost').pathname.split('/').at(-1)
    return { ok: true, status: 200, json: async () => ({ success: true, data: payloads[key] }) }
  }))

  render(<MemoryRouter initialEntries={['/admin?tab=overview']}><Routes><Route path="/admin" element={<FamilyInbox />} /></Routes></MemoryRouter>)

  expect(await screen.findByText('203.0.113.9')).toBeInTheDocument()
  expect(screen.getByText('203.0.113.7')).toBeInTheDocument()
})
