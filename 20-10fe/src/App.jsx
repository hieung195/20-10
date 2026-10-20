import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import VisitTracker from './components/VisitTracker'
import MusicPlayer from './components/MusicPlayer'
import './App.css'
const LandingPage = lazy(() => import('./pages/FamilyLandingPage'))
const CelebrationPage = lazy(() => import('./pages/CelebrationPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const FamilyInbox = lazy(() => import('./pages/admin/FamilyInbox'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function PublicAccessGate({ children }) {
  const { pathname } = useLocation()
  const [result, setResult] = useState({ pathname: '', status: 'checking' })
  const adminPath = pathname === '/login' || pathname === '/admin' || pathname.startsWith('/admin/')

  useEffect(() => {
    let active = true
    if (!adminPath) fetch(`${apiBase}/api/access`, { cache: 'no-store' })
      .then(response => { if (active) setResult({ pathname, status: response.status === 403 ? 'blocked' : 'allowed' }) })
      .catch(() => { if (active) setResult({ pathname, status: 'allowed' }) })
    return () => { active = false }
  }, [adminPath, pathname])

  const status = adminPath ? 'allowed' : result.pathname === pathname ? result.status : 'checking'
  if (status === 'checking') return <div className="app-route-loading" role="status">Đang kiểm tra quyền truy cập…</div>
  if (status === 'blocked') return <main className="blocked-access"><div><h1>Bạn không thể truy cập vào trang web này !</h1></div></main>
  return children
}

function AdminShortcut() {
  const { pathname } = useLocation()
  if (pathname === '/login' || pathname.startsWith('/admin')) return null
  return <Link className="admin-switch" to="/login" aria-label="Đăng nhập quản trị" title="Đăng nhập quản trị">#</Link>
}

export default function App() {
  return <PublicAccessGate><><VisitTracker /><AdminShortcut /><MusicPlayer /><Suspense fallback={<div className="app-route-loading" role="status">Đang tải...</div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/celebrate/:name" element={<CelebrationPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedAdminRoute />}><Route path="/admin" element={<FamilyInbox />} /><Route path="/admin/*" element={<Navigate to="/admin" replace />} /></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></></PublicAccessGate>
}
