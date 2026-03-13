import { useState, useEffect, useCallback } from 'react'
import { getKPIs, getCharts } from '../api'
import KPICard from '../components/KPICard'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#F97316', '#06B6D4', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#141D2E', border: '1px solid #1E2D45',
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {label && <div style={{ color: '#64748B', marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#E2E8F0' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: 'Space Mono, monospace', fontSize: 11,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#64748B', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 20, height: 1, background: '#F97316', display: 'inline-block' }} />
      {children}
    </div>
  )
}

function ChartCard({ title, children, span = 1 }) {
  return (
    <div className="card-glow" style={{
      background: '#141D2E', border: '1px solid #1E2D45',
      borderRadius: 12, padding: '20px 24px',
      gridColumn: `span ${span}`,
    }}>
      <div style={{
        fontSize: 13, fontWeight: 600, color: '#94A3B8',
        fontFamily: 'Space Mono, monospace', letterSpacing: '0.05em',
        marginBottom: 20,
      }}>{title}</div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchAll = useCallback(async () => {
    try {
      const [k, c] = await Promise.all([getKPIs(), getCharts()])
      setKpis(k)
      setCharts(c)
      setLastRefresh(new Date())
    } catch (e) {
      toast.error('Failed to load data — is the API running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    // Auto-refresh every 30s (data is semi-real-time)
    const t = setInterval(fetchAll, 30000)
    return () => clearInterval(t)
  }, [fetchAll])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{
        width: 48, height: 48, border: '3px solid #1E2D45',
        borderTop: '3px solid #F97316', borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ color: '#64748B', fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
        LOADING SYSTEM DATA...
      </div>
    </div>
  )

  const violByType = charts?.violations_by_type || []
  const slumStatus = charts?.slum_status || []
  const allotTrend = charts?.allotment_trend || []
  const flatStatus = charts?.flat_status || []
  const violTrend  = charts?.violation_trend || []
  const buildings  = charts?.buildings || []
  const eligibility = charts?.eligibility || []
  const wardData   = charts?.ward_allotments || []

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>
            SYSTEM OVERVIEW
          </h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '6px 0 0', fontFamily: 'JetBrains Mono, monospace' }}>
            Mumbai SRA · Slum Rehabilitation Monitoring
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono, monospace' }}>
            Auto-refresh 30s · Last: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchAll}
            style={{
              background: 'transparent', border: '1px solid #1E2D45',
              color: '#94A3B8', borderRadius: 6, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12, fontFamily: 'Space Mono, monospace',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.target.style.borderColor = '#F97316'}
            onMouseLeave={e => e.target.style.borderColor = '#1E2D45'}
          >↺ REFRESH</button>
        </div>
      </div>

      {/* KPI Grid */}
      <SectionTitle>Key Metrics</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <KPICard label="Total Beneficiaries" value={kpis?.total_beneficiaries} icon="◉" color="#F97316" sublabel="Registered families" />
        <KPICard label="Active Allotments"   value={kpis?.active_allotments}   icon="⬡" color="#06B6D4" sublabel="Currently occupied" />
        <KPICard label="Open Violations"     value={kpis?.open_violations}     icon="⚠" color="#EF4444" sublabel="Needs attention" />
        <KPICard label="Vacant Flats"        value={kpis?.vacant_flats}        icon="⬢" color="#10B981" sublabel="Available units" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        <KPICard label="Occupied Buildings"  value={kpis?.occupied_buildings}   icon="🏢" color="#8B5CF6" sublabel="Active projects" />
        <KPICard label="Rehabilitated Slums" value={kpis?.rehabilitated_slums}  icon="✓" color="#10B981" sublabel="Completed zones" />
        <KPICard label="Unauthorized Rentals" value={kpis?.unauthorized_rentals} icon="⛔" color="#F59E0B" sublabel="Policy violations" />
        <KPICard label="Pending Reviews"     value={kpis?.pending_review}       icon="⏳" color="#F97316" sublabel="Eligibility queue" />
      </div>

      {/* Charts row 1 */}
      <SectionTitle>Analytics</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Violations by type */}
        <ChartCard title="VIOLATIONS BY TYPE">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={violByType} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
              <XAxis dataKey="violation_type" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => v.replace('_', '\n')} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {violByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Flat status pie */}
        <ChartCard title="FLAT STATUS DISTRIBUTION">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={flatStatus} dataKey="count" nameKey="flat_status"
                cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                paddingAngle={3}>
                {flatStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={v => <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Slum status pie */}
        <ChartCard title="SLUM STATUS">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={slumStatus} dataKey="count" nameKey="status"
                cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                paddingAngle={3}>
                {slumStatus.map((_, i) => <Cell key={i} fill={['#10B981','#F97316','#06B6D4'][i % 3]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={v => <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Allotment trend line */}
        <ChartCard title="ALLOTMENT TREND BY YEAR">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={allotTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#F97316" strokeWidth={2}
                dot={{ fill: '#F97316', r: 4 }} activeDot={{ r: 6, fill: '#EA580C' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Eligibility */}
        <ChartCard title="ELIGIBILITY BREAKDOWN">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={eligibility} dataKey="count" nameKey="eligibility_status"
                cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                paddingAngle={4}>
                {eligibility.map((e, i) => (
                  <Cell key={i} fill={
                    e.eligibility_status === 'eligible' ? '#10B981' :
                    e.eligibility_status === 'ineligible' ? '#EF4444' : '#F59E0B'
                  } />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={v => <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'JetBrains Mono' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>

        {/* Violation trend sparkline */}
        <ChartCard title="VIOLATION TREND (24 MONTHS)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={violTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748B' }}
                tickFormatter={v => v?.slice(5)} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#EF4444" strokeWidth={2}
                dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ward allotments bar */}
        <ChartCard title="ACTIVE ALLOTMENTS BY WARD">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={wardData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis dataKey="ward_number" type="category" width={80}
                tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="allotments" fill="#06B6D4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top buildings table */}
      <SectionTitle>Top Buildings by Flat Count</SectionTitle>
      <div className="card-glow" style={{
        background: '#141D2E', border: '1px solid #1E2D45',
        borderRadius: 12, overflow: 'hidden', marginBottom: 40,
      }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Project Name</th>
              <th>Status</th>
              <th>Flats</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b, i) => (
              <tr key={i}>
                <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 12 }}>{String(i+1).padStart(2,'0')}</td>
                <td style={{ fontWeight: 500 }}>{b.project_name}</td>
                <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      height: 4, width: Math.min((b.flat_count / 200) * 100, 100),
                      background: '#F97316', borderRadius: 2, minWidth: 4,
                    }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{b.flat_count}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
