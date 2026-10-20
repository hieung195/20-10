import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
export default function VisitTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname === '/login') return
    let id
    try {
      id = sessionStorage.getItem('family-visit-id') || crypto.randomUUID()
      sessionStorage.setItem('family-visit-id', id)
    } catch { id = crypto.randomUUID() }
    // Delay one event loop so StrictMode cleanup can cancel the first mount.
    const timer = setTimeout(() => { api.post('/api/visits', { sessionId: id, page: pathname }).catch(() => {}) }, 0)
    return () => clearTimeout(timer)
  }, [pathname])
  return null
}
