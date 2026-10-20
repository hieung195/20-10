import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { adminApi, adminAuth } from '../../api/adminApi'
import Petals from '../../components/paper/Petals'
import { familyAssets } from '../../lib/familyAssets'
import '../../styles/login.css'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (adminAuth.getToken()) return <Navigate to="/admin" replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminApi.login(form.username.trim(), form.password)
      adminAuth.setToken(token)
      navigate(location.state?.from || '/admin', { replace: true })
    } catch (err) {
      setError(err.status === 401 ? 'Sai tên đăng nhập hoặc mật khẩu' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login page-paper">
      <Petals count={2} />
      <form className="admin-login__card letter-paper" onSubmit={submit}>
        <div className="admin-login__brand">
          <img src={familyAssets.brand} alt="" />
          <span>THƯ NHÀ</span>
        </div>
        <h1>Đăng nhập quản trị</h1>
        <label htmlFor="admin-username">
          Tên đăng nhập
          <input id="admin-username" className="input-hand" autoComplete="username" required value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </label>
        <label htmlFor="admin-password">
          Mật khẩu
          <input id="admin-password" className="input-hand" type="password" autoComplete="current-password" required value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </label>
        {error && <p className="admin-alert error">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
        {/* Lối ra cho người lỡ bấm "Quản trị" mà không phải admin */}
        <Link to="/" className="link-dashed admin-login__home">← Về trang chủ</Link>
      </form>
    </main>
  )
}

export default LoginPage
