import { useState, useEffect, useCallback } from 'react'
import { getAllotments, createAllotment } from '../api'
import toast from 'react-hot-toast'

export default function Allotments() {
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [statusF, setStatusF] = useState('active')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ flat_id: '', family_id: '', beneficiary_id: '', allotment_date: '' })
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getAllotments({ status_filter: statusF || undefined, limit: 100 })
      setData(rows)
    } catch { toast.error('Failed to load allotments') }
    finally { setLoading(false) }
  }, [statusF])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createAllotment({
        flat_id: parseInt(form.flat_id),
        family_id: parseInt(form.family_id),
        beneficiary_id: parseInt(form.beneficiary_id),
        allotment_date: form.allotment_date,
      })
      toast.success('Allotment created')
      setShowAdd(false)
      setForm({ flat_id: '', family_id: '', beneficiary_id: '', allotment_date: '' })
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to create allotment')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Mono', fontSize: 22, color: '#E2E8F0', margin: 0 }}>ALLOTMENTS</h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '6px 0 0', fontFamily: 'JetBrains Mono' }}>
            {data.length} records · Lock-in: 10 years from allotment date
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
          <button onClick={() => setShowAdd(true)} style={{
            background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none',
            color: '#fff', borderRadius: 6, padding: '8px 18px',
            cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
            boxShadow: '0 0 15px rgba(249,115,22,0.3)',
          }}>+ NEW ALLOTMENT</button>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
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
            <div style={{ fontFamily: 'Space Mono', fontSize: 14, color: '#E2E8F0', marginBottom: 8, fontWeight: 700 }}>
              NEW ALLOTMENT
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 24, fontFamily: 'JetBrains Mono' }}>
              Lock-in end date auto-calculated as +10 years
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Flat ID', 'flat_id', 'number'],
                ['Family ID', 'family_id', 'number'],
                ['Beneficiary ID', 'beneficiary_id', 'number'],
                ['Allotment Date', 'allotment_date', 'date'],
              ].map(([label, key, type]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                  <input type={type} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={{
                background: 'transparent', border: '1px solid #1E2D45', color: '#64748B',
                borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
              }}>CANCEL</button>
              <button onClick={handleCreate} disabled={saving} style={{
                background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none',
                color: '#fff', borderRadius: 6, padding: '8px 20px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
              }}>{saving ? 'CREATING...' : 'CREATE'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-glow" style={{ background: '#141D2E', border: '1px solid #1E2D45', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>LOADING...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Beneficiary</th>
                  <th>Family</th>
                  <th>Flat</th>
                  <th>Project</th>
                  <th>Allotment Date</th>
                  <th>Lock-in Ends</th>
                  <th>Lock-in Status</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(a => {
                  const lockExpired = new Date(a.lock_in_end_date) < new Date()
                  const daysLeft = Math.ceil((new Date(a.lock_in_end_date) - new Date()) / (1000*60*60*24))
                  return (
                    <tr key={a.allotment_id}>
                      <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{a.allotment_id}</td>
                      <td style={{ fontWeight: 500 }}>{a.beneficiary_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{a.family_id}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: '#06B6D4' }}>{a.flat_number}</td>
                      <td style={{ fontSize: 12 }}>{a.project_name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                        {new Date(a.allotment_date).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: lockExpired ? '#64748B' : '#F97316' }}>
                        {new Date(a.lock_in_end_date).toLocaleDateString('en-IN')}
                      </td>
                      <td>
                        {!lockExpired && a.allotment_status === 'active' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 11, color: '#F97316', fontFamily: 'JetBrains Mono',
                          }}>
                            🔒 {daysLeft > 0 ? `${daysLeft}d left` : 'Expiring'}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'JetBrains Mono' }}>Unlocked</span>
                        )}
                      </td>
                      <td><span className={`badge badge-${a.allotment_status}`}>{a.allotment_status}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {data.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>NO RECORDS FOUND</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
