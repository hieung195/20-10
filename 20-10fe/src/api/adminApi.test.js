import { afterEach, expect, test } from 'vitest'
import { adminAuth } from './adminApi'

afterEach(() => adminAuth.clear())

test('remember-device login survives a browser session; regular login stays session-only', () => {
  adminAuth.setToken('remembered-token', true)
  expect(localStorage.getItem('gift_admin_token')).toBe('remembered-token')
  expect(sessionStorage.getItem('gift_admin_token')).toBeNull()
  expect(adminAuth.getToken()).toBe('remembered-token')

  adminAuth.setToken('session-token')
  expect(localStorage.getItem('gift_admin_token')).toBeNull()
  expect(sessionStorage.getItem('gift_admin_token')).toBe('session-token')
})
