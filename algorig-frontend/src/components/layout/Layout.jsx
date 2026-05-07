import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'

export default function Layout() {
  const location = useLocation()
  const isScriptEditor = location.pathname.startsWith('/scripts/')
    || location.pathname === '/scripts/new'
    || location.pathname.startsWith('/battles/')

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {!isScriptEditor && <LeftPanel />}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <Outlet />
        </main>
        {!isScriptEditor && <RightPanel />}
      </div>
    </div>
  )
}
