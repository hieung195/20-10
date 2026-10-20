import { Link, useLocation } from 'react-router-dom'

export default function AdminShortcut() {
  const { pathname } = useLocation()
  if (pathname !== '/' && !pathname.startsWith('/celebrate/')) return null
  return <Link className="admin-switch" to="/login" aria-label="Đăng nhập quản trị" title="Đăng nhập quản trị">#</Link>
}
