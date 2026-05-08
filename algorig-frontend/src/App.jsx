import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import ScriptEditor from './pages/ScriptEditor'
import ScriptViewer from './pages/ScriptViewer'
import RobotBrowser from './pages/RobotBrowser'
import BattleLauncher from './pages/BattleLauncher'
import BattleReplay from './pages/BattleReplay'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="scripts" element={<ScriptViewer />} />
        <Route path="scripts/new" element={<ScriptEditor />} />
        <Route path="scripts/:id" element={<ScriptEditor />} />
        <Route path="robots" element={<RobotBrowser />} />
        <Route path="battles/new" element={<BattleLauncher />} />
        <Route path="battles/:id" element={<BattleReplay />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
