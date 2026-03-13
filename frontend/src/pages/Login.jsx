import { useState } from 'react'
import { healthCheck } from '../api'
import toast from 'react-hot-toast'

export default function Login({ onLogin }) {
  const [user, setUser] = useState('admin')
  const [pass, setPass] = useState('sra2024')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Quick credential test via health endpoint
      onLogin(user, pass)
      await healthCheck()
      toast.success('Access granted')
    } catch {
      toast.error('Invalid credentials')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0E1A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(249,115,22,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(249,115,22,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        animation: 'gridMove 20s linear infinite',
      }} />
      {/* Glow orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)',
        top: '50%', left: '30%', transform: 'translate(-50%,-50%)',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
        bottom: '10%', right: '20%',
      }} />

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0,0); }
          100% { transform: translate(40px,40px); }
        }
        @keyframes borderPulse {
          0%,100% { border-color: rgba(249,115,22,0.3); }
          50% { border-color: rgba(249,115,22,0.8); }
        }
        .login-card { animation: borderPulse 3s ease-in-out infinite; }
      `}</style>

      <div className="login-card" style={{
        position: 'relative', zIndex: 1,
        background: 'rgba(20,29,46,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 16,
        padding: '48px 40px',
        width: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: 'linear-gradient(135deg, #F97316, #EA580C)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28,
            boxShadow: '0 0 30px rgba(249,115,22,0.4)',
          }}>🏢</div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 20, fontWeight: 700,
            color: '#E2E8F0',
            letterSpacing: '0.05em',
          }}>SRA MONITOR</div>
          <div style={{ color: '#64748B', fontSize: 12, marginTop: 4, fontFamily: 'JetBrains Mono, monospace' }}>
            MUMBAI SLUM REHABILITATION AUTHORITY
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 11, fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#64748B', marginBottom: 8,
            }}>Username</label>
            <input
              value={user}
              onChange={e => setUser(e.target.value)}
              style={{ width: '100%' }}
              placeholder="admin"
            />
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{
              display: 'block', fontSize: 11, fontFamily: 'Space Mono, monospace',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#64748B', marginBottom: 8,
            }}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              style={{ width: '100%' }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#374151' : 'linear-gradient(135deg, #F97316, #EA580C)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontFamily: 'Space Mono, monospace',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 0 20px rgba(249,115,22,0.3)',
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM →'}
          </button>
        </form>

        <div style={{
          marginTop: 24, padding: '12px 16px',
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 8,
          fontSize: 12, color: '#64748B',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <div>demo: admin / sra2024</div>
          <div>viewer: viewer / readonly</div>
        </div>
      </div>
    </div>
  )
}
