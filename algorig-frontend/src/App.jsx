import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ScriptViewer from './pages/ScriptViewer'
import RobotBrowser from './pages/RobotBrowser'
import BattleHistory from './pages/BattleHistory'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OAuthCallback from './pages/OAuthCallback'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute'

// Heavy components loaded lazily to reduce initial bundle
const ScriptEditor   = lazy(() => import('./pages/ScriptEditor'))
const BattleLauncher = lazy(() => import('./pages/BattleLauncher'))
const BattleReplay   = lazy(() => import('./pages/BattleReplay'))
const Profile        = lazy(() => import('./pages/Profile'))
const Repository     = lazy(() => import('./pages/Repository'))
const ScriptDetail   = lazy(() => import('./pages/ScriptDetail'))

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: '#080810',
    color: '#f97316',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '14px',
    gap: '12px',
  }}>
    <div style={{
      width: '18px',
      height: '18px',
      border: '2px solid rgba(249,115,22,0.2)',
      borderTopColor: '#f97316',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    Loading...
  </div>
)

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth pages — full-screen, no Layout wrapper */}
        <Route path="/login" element={
          <PublicOnlyRoute><Login /></PublicOnlyRoute>
        } />
        <Route path="/signup" element={
          <PublicOnlyRoute><Signup /></PublicOnlyRoute>
        } />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Main app with Layout (Navbar + panels) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="robots" element={<RobotBrowser />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="repository" element={<Repository />} />
          <Route path="repository/:id" element={<ScriptDetail />} />

          {/* Protected routes */}
          <Route path="scripts" element={
            <ProtectedRoute><ScriptViewer /></ProtectedRoute>
          } />
          <Route path="scripts/new" element={
            <ProtectedRoute><ScriptEditor /></ProtectedRoute>
          } />
          <Route path="scripts/:id" element={
            <ProtectedRoute><ScriptEditor /></ProtectedRoute>
          } />
          <Route path="battles" element={
            <ProtectedRoute><BattleHistory /></ProtectedRoute>
          } />
          <Route path="battles/new" element={
            <ProtectedRoute><BattleLauncher /></ProtectedRoute>
          } />
          <Route path="battles/:id" element={
            <ProtectedRoute><BattleReplay /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
