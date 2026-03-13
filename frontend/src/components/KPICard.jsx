import { useEffect, useRef, useState } from 'react'

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    const steps = 30
    const step = value / steps
    let current = 0
    const t = setInterval(() => {
      current += step
      if (current >= value) { setDisplay(value); clearInterval(t) }
      else setDisplay(Math.floor(current))
    }, 20)
    return () => clearInterval(t)
  }, [value])
  return <>{display.toLocaleString()}</>
}

export default function KPICard({ label, value, icon, color = '#F97316', sublabel, trend }) {
  const trendColor = trend > 0 ? '#EF4444' : trend < 0 ? '#10B981' : '#64748B'

  return (
    <div className="card-glow" style={{
      background: '#141D2E',
      border: '1px solid #1E2D45',
      borderRadius: 12,
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at 80% 20%, ${color}15, transparent 70%)`,
        borderRadius: '50%',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{
            fontSize: 11, fontFamily: 'Space Mono, monospace',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#64748B', marginBottom: 12,
          }}>{label}</div>
          <div style={{
            fontSize: 32, fontWeight: 700,
            fontFamily: 'Space Mono, monospace',
            color: '#E2E8F0',
            lineHeight: 1,
          }}>
            <AnimatedNumber value={value || 0} />
          </div>
          {sublabel && (
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{sublabel}</div>
          )}
        </div>
        <div style={{
          width: 44, height: 44,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}>{icon}</div>
      </div>
    </div>
  )
}
