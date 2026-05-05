import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Left panel */}
        <aside style={{
          width: '240px',
          minWidth: '240px',
          overflowY: 'auto',
          background: 'rgba(8,8,16,0.6)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>
          <LeftPanel />
        </aside>

        {/* Center content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <Outlet />
        </main>

        {/* Right panel */}
        <aside style={{
          width: '280px',
          minWidth: '280px',
          overflowY: 'auto',
          background: 'rgba(8,8,16,0.6)',
          borderLeft: '1px solid rgba(255,255,255,0.05)',
        }}>
          <RightPanel />
        </aside>
      </div>
    </div>
  )
}
