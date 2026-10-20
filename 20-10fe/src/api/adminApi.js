const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const tokenKey = 'gift_admin_token'
export const adminAuth = {
  getToken: () => sessionStorage.getItem(tokenKey),
  setToken: token => { localStorage.removeItem(tokenKey); sessionStorage.setItem(tokenKey, token) },
  clear: () => { sessionStorage.removeItem(tokenKey); localStorage.removeItem(tokenKey) },
}
async function request(path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = adminAuth.getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`${base}${path}`, { method: body ? 'POST' : 'GET', headers, ...(body ? { body: JSON.stringify(body) } : {}) })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && !path.endsWith('/login')) {
      adminAuth.clear()
      window.dispatchEvent(new Event('gift-admin-unauthorized'))
    }
    throw Object.assign(new Error(payload?.message || 'Không thể kết nối máy chủ'), { status: response.status })
  }
  return payload.data
}
export const adminApi = {
  login: (username, password) => request('/api/auth/admin/login', { username, password }),
  verifySession: () => request('/api/auth/admin/me'),
}
