import { useState, useEffect } from 'react'
import { getSlums, getBuildings, getRentals } from '../api'
import toast from 'react-hot-toast'

function ProgressBar({ value, max, color = '#F97316' }) {
  const pct = max ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 4, background: '#1E2D45', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#64748B', minWidth: 36 }}>
        {value}/{max}
      </span>
    </div>
  )
}

export default function Slums() {
  const [slums, setSlums]       = useState([])
  const [buildings, setBuildings] = useState([])
  const [rentals, setRentals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('slums')

  useEffect(() => {
    Promise.all([getSlums(), getBuildings(), getRentals()])
      .then(([s, b, r]) => { setSlums(s); setBuildings(b); setRentals(r) })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const TABS = [
    { id: 'slums', label: 'Slum Surveys', count: slums.length },
    { id: 'buildings', label: 'Buildings', count: buildings.length },
    { id: 'rentals', label: 'Approved Rentals', count: rentals.length },
  ]

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Space Mono', fontSize: 22, color: '#E2E8F0', margin: 0 }}>SLUMS & BUILDINGS</h1>
        <p style={{ color: '#64748B', fontSize: 13, margin: '6px 0 0', fontFamily: 'JetBrains Mono' }}>
          Mumbai SRA Rehabilitation Zones
        </p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Slums Surveyed', value: slums.length, color: '#F97316' },
          { label: 'Rehabilitation Buildings', value: buildings.length, color: '#06B6D4' },
          { label: 'Total Families Surveyed', value: slums.reduce((a, s) => a + (s.total_families || 0), 0).toLocaleString(), color: '#10B981' },
        ].map((c, i) => (
          <div key={i} className="card-glow" style={{
            background: '#141D2E', border: '1px solid #1E2D45', borderRadius: 12, padding: '20px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${c.color}, transparent)` }} />
            <div style={{ fontSize: 11, fontFamily: 'Space Mono', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontFamily: 'Space Mono', fontWeight: 700, color: '#E2E8F0' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 20px',
            background: tab === t.id ? 'rgba(249,115,22,0.1)' : 'transparent',
            border: tab === t.id ? '1px solid rgba(249,115,22,0.4)' : '1px solid #1E2D45',
            color: tab === t.id ? '#F97316' : '#64748B',
            borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Space Mono', fontSize: 11, letterSpacing: '0.05em',
            transition: 'all 0.2s',
          }}>
            {t.label.toUpperCase()} ({t.count})
          </button>
        ))}
      </div>

      <div className="card-glow" style={{ background: '#141D2E', border: '1px solid #1E2D45', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>LOADING...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>

            {/* SLUMS TAB */}
            {tab === 'slums' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Slum Name</th><th>Location</th><th>Ward</th>
                    <th>Survey Date</th><th>Families</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slums.map(s => (
                    <tr key={s.slum_id}>
                      <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{s.slum_id}</td>
                      <td style={{ fontWeight: 500 }}>{s.slum_name}</td>
                      <td style={{ fontSize: 12, color: '#94A3B8' }}>{s.location}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#06B6D4' }}>{s.ward_number}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                        {new Date(s.survey_date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{s.total_families?.toLocaleString()}</td>
                      <td><span className={`badge badge-${s.status}`}>{s.status?.replace(/_/g,' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BUILDINGS TAB */}
            {tab === 'buildings' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Project Name</th><th>Builder</th><th>Ward</th>
                    <th>Floors</th><th>Flat Occupancy</th><th>Built</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {buildings.map(b => (
                    <tr key={b.building_id}>
                      <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{b.building_id}</td>
                      <td style={{ fontWeight: 500 }}>{b.project_name}</td>
                      <td style={{ fontSize: 12, color: '#94A3B8' }}>{b.builder_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#06B6D4' }}>{b.ward_number}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{b.total_floors}</td>
                      <td style={{ minWidth: 160 }}>
                        <ProgressBar
                          value={b.total_flats_actual - (b.vacant_count || 0)}
                          max={b.total_flats_actual}
                          color={b.status === 'occupied' ? '#10B981' : b.status === 'ready' ? '#F97316' : '#64748B'}
                        />
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>{b.construction_year}</td>
                      <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* RENTALS TAB */}
            {tab === 'rentals' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Beneficiary</th><th>Flat</th><th>Project</th>
                    <th>Tenant</th><th>Monthly Rent</th><th>Start</th><th>End</th>
                    <th>Approved By</th><th>Address Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map(r => (
                    <tr key={r.rental_id}>
                      <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{r.rental_id}</td>
                      <td style={{ fontWeight: 500 }}>{r.beneficiary_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#06B6D4' }}>{r.flat_number}</td>
                      <td style={{ fontSize: 12 }}>{r.project_name}</td>
                      <td>{r.tenant_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#10B981' }}>
                        ₹{parseFloat(r.monthly_rent || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                        {r.start_date ? new Date(r.start_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                        {r.end_date ? new Date(r.end_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{r.approved_by || '—'}</td>
                      <td>{r.new_address_verified
                        ? <span className="badge badge-active">Verified</span>
                        : <span className="badge badge-under_review">Pending</span>}
                      </td>
                    </tr>
                  ))}
                  {rentals.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>NO APPROVED RENTALS FOUND</td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
