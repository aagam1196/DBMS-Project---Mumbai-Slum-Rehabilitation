import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { healthCheck } from '../api'

const NAV = [
  { to: '/',               label: 'Overview',      icon: '◈' },
  { to: '/violations',     label: 'Violations',    icon: '⚠' },
  { to: '/beneficiaries',  label: 'Beneficiaries', icon: '◉' },
  { to: '/allotments',     label: 'Allotments',    icon: '⬡' },
  { to: '/slums',          label: 'Slums & Buildings', icon: '⬢' },
]

export default function Layout({ children, onLogout }) {
  const [apiOk, setApiOk] = useState(null)
  const location = useLocation()

  useEffect(() => {
    healthCheck().then(() => setApiOk(true)).catch(() => setApiOk(false))
    const t = setInterval(() => {
      healthCheck().then(() => setApiOk(true)).catch(() => setApiOk(false))
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const pageTitle = NAV.find(n => n.to === location.pathname)?.label || 'Dashboard'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0E1A' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: '#0D1321',
        borderRight: '1px solid #1E2D45',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #1E2D45',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              boxShadow: '0 0 15px rgba(249,115,22,0.3)',
            }}>🏢</div>
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: '#E2E8F0', lineHeight: 1 }}>
                SRA MONITOR
              </div>
              <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                v1.0 · MUMBAI
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <div style={{
          margin: '12px 16px',
          padding: '8px 12px',
          background: apiOk === false ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${apiOk === false ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className={apiOk !== false ? 'pulse-dot' : ''} style={{
            width: 6, height: 6, borderRadius: '50', flexShrink: 0,
            background: apiOk === null ? '#F59E0B' : apiOk ? '#10B981' : '#EF4444',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#64748B' }}>
            {apiOk === null ? 'Connecting...' : apiOk ? 'API Online' : 'API Offline'}
          </span>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#334155', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 8px', marginBottom: 4 }}>
            Navigation
          </div>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#F97316' : '#94A3B8',
                background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #F97316' : '2px solid transparent',
                transition: 'all 0.2s',
              })}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1E2D45' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '9px',
              background: 'transparent',
              border: '1px solid #1E2D45',
              color: '#64748B',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: 'Space Mono, monospace',
              fontSize: 11,
              letterSpacing: '0.1em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.borderColor = '#EF4444'; e.target.style.color = '#EF4444' }}
            onMouseLeave={e => { e.target.style.borderColor = '#1E2D45'; e.target.style.color = '#64748B' }}
          >
            LOGOUT ⏻
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={{
          height: 60,
          borderBottom: '1px solid #1E2D45',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(13,19,33,0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#334155', fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
              SRA /
            </span>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#E2E8F0', fontWeight: 700 }}>
              {pageTitle.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #F97316, #EA580C)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
            }}>A</div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
