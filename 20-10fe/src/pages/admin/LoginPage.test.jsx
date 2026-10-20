import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const { login, setToken } = vi.hoisted(() => ({ login: vi.fn(), setToken: vi.fn() }))
vi.mock('../../api/adminApi', () => ({
  adminApi: { login },
  adminAuth: { getToken: () => null, setToken },
}))
vi.mock('../../components/paper/Petals', () => ({ default: () => null }))

import LoginPage from './LoginPage'

afterEach(() => { cleanup(); vi.clearAllMocks() })

test('sends the remember-device choice and persists the returned token', async () => {
  login.mockResolvedValue({ token: 'admin-token' })
  render(<MemoryRouter><LoginPage /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Tên đăng nhập'), { target: { value: 'admin' } })
  fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: '1' } })
  fireEvent.click(screen.getByRole('checkbox', { name: /Nhớ thiết bị này/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

  await waitFor(() => expect(login).toHaveBeenCalledWith('admin', '1', true))
  expect(setToken).toHaveBeenCalledWith('admin-token', true)
})
