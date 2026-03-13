import { useState, useEffect, useCallback } from 'react'
import { getViolations, updateViolation } from '../api'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['open', 'under_investigation', 'resolved', 'dismissed']
const TYPE_OPTIONS   = ['illegal_sale', 'duplicate_claim', 'lock_in_breach', 'unauthorized_rental', 'abandonment']

export default function Violations() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusF, setStatusF]   = useState('')
  const [typeF, setTypeF]       = useState('')
  const [editing, setEditing]   = useState(null)   // { id, status, description }
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getViolations({ status_filter: statusF || undefined, type_filter: typeF || undefined, limit: 100 })
      setData(rows)
    } catch { toast.error('Failed to load violations') }
    finally { setLoading(false) }
  }, [statusF, typeF])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateViolation(editing.id, { status: editing.status, description: editing.description })
      toast.success('Violation updated')
      setEditing(null)
      load()
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, color: '#E2E8F0', margin: 0 }}>VIOLATION LOG</h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '6px 0 0', fontFamily: 'JetBrains Mono' }}>
            {data.length} record{data.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ minWidth: 180 }}>
            <option value="">All Types</option>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={load} style={{
            background: 'transparent', border: '1px solid #1E2D45',
            color: '#94A3B8', borderRadius: 6, padding: '8px 16px',
            cursor: 'pointer', fontFamily: 'Space Mono, monospace', fontSize: 11,
          }}>↺</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(8px)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#141D2E', border: '1px solid #1E2D45',
            borderRadius: 16, padding: 32, width: 480,
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, color: '#E2E8F0', marginBottom: 24, fontWeight: 700 }}>
              UPDATE VIOLATION #{editing.id}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Status</label>
              <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} style={{ width: '100%' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Notes</label>
              <textarea
                value={editing.description || ''}
                onChange={e => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                style={{
                  width: '100%', background: '#0D1321', border: '1px solid #1E2D45',
                  color: '#E2E8F0', borderRadius: 6, padding: '10px 12px',
                  fontFamily: 'DM Sans', fontSize: 13, resize: 'vertical', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{
                background: 'transparent', border: '1px solid #1E2D45', color: '#64748B',
                borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
              }}>CANCEL</button>
              <button onClick={handleSave} disabled={saving} style={{
                background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none',
                color: '#fff', borderRadius: 6, padding: '8px 20px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
              }}>{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-glow" style={{ background: '#141D2E', border: '1px solid #1E2D45', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>
            LOADING...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Beneficiary</th>
                  <th>Aadhar</th>
                  <th>Flat</th>
                  <th>Project</th>
                  <th>Detected</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.map(v => (
                  <tr key={v.violation_id}>
                    <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{v.violation_id}</td>
                    <td>
                      <span className={`badge badge-${v.violation_type === 'illegal_sale' ? 'cancelled' : v.violation_type === 'lock_in_breach' ? 'under_investigation' : 'open'}`}>
                        {v.violation_type?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{v.beneficiary_name}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>{v.aadhar_number}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{v.flat_number}</td>
                    <td style={{ fontSize: 12 }}>{v.project_name}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                      {new Date(v.detected_date).toLocaleDateString('en-IN')}
                    </td>
                    <td><span className={`badge badge-${v.status}`}>{v.status?.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: 11, color: '#64748B' }}>{v.reported_by || '—'}</td>
                    <td>
                      <button
                        onClick={() => setEditing({ id: v.violation_id, status: v.status, description: v.description || '' })}
                        style={{
                          background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                          color: '#F97316', borderRadius: 5, padding: '4px 10px',
                          cursor: 'pointer', fontSize: 11, fontFamily: 'Space Mono',
                        }}
                      >EDIT</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>
                NO VIOLATIONS FOUND
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
