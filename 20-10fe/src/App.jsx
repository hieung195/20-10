import { lazy, Suspense } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import VisitTracker from './components/VisitTracker'
import MusicPlayer from './components/MusicPlayer'
import './App.css'
const LandingPage = lazy(() => import('./pages/FamilyLandingPage'))
const CelebrationPage = lazy(() => import('./pages/CelebrationPage'))
const LoginPage = lazy(() => import('./pages/admin/LoginPage'))
const FamilyInbox = lazy(() => import('./pages/admin/FamilyInbox'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
export default function App() {
  return <><VisitTracker /><MusicPlayer /><Suspense fallback={<div className="app-route-loading" role="status">Đang tải...</div>}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/celebrate/:name" element={<CelebrationPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedAdminRoute />}><Route path="/admin" element={<FamilyInbox />} /><Route path="/admin/*" element={<Navigate to="/admin" replace />} /></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></Suspense></>
}
