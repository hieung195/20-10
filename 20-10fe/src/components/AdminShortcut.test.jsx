import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminShortcut from './AdminShortcut'

afterEach(cleanup)

test('shows a plain # link on public pages and hides it from admin and login pages', () => {
  render(<MemoryRouter initialEntries={['/']}><AdminShortcut /></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Đăng nhập quản trị' })).toHaveTextContent('#')
  expect(screen.getByRole('link', { name: 'Đăng nhập quản trị' })).toHaveAttribute('href', '/login')

  cleanup()
  render(<MemoryRouter initialEntries={['/login']}><AdminShortcut /></MemoryRouter>)
  expect(screen.queryByRole('link', { name: 'Đăng nhập quản trị' })).toBeNull()

  cleanup()
  render(<MemoryRouter initialEntries={['/admin']}><AdminShortcut /></MemoryRouter>)
  expect(screen.queryByRole('link', { name: 'Đăng nhập quản trị' })).toBeNull()
})
