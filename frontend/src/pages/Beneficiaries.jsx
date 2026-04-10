import { useState, useEffect, useCallback } from 'react'
import { getBeneficiaries, createBeneficiary, deleteBeneficiary, searchBeneficiary, getSlums } from '../api'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  family_id: '', aadhar_number: '', name: '', dob: '', gender: 'male',
  contact: '', slum_id: '', is_head_of_family: false, eligibility_status: 'under_review',
}

const PAGE_SIZE = 50

export default function Beneficiaries() {
  const [data, setData]           = useState([])
  const [slums, setSlums]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [searchRes, setSearchRes] = useState(null)
  const [searching, setSearching] = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [eligFilter, setEligFilter] = useState('')
  const [page, setPage]           = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, s] = await Promise.all([
        getBeneficiaries({ limit: 5000, offset: 0, eligibility: eligFilter || undefined }),
        getSlums()
      ])
      setData(rows)
      setSlums(s)
      setPage(0)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }, [eligFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!search.trim() || search.length < 2) { setSearchRes(null); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchBeneficiary(search)
        setSearchRes(res)
      } catch {} finally { setSearching(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createBeneficiary({
        ...form,
        family_id: parseInt(form.family_id),
        slum_id: parseInt(form.slum_id),
      })
      toast.success('Beneficiary created')
      setShowAdd(false)
      setForm(EMPTY_FORM)
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Creation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return
    try {
      await deleteBeneficiary(id)
      toast.success('Deleted')
      load()
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Delete failed')
    }
  }

  const displayData = searchRes !== null ? searchRes : data
  const totalPages  = Math.ceil(displayData.length / PAGE_SIZE)
  const pageData    = displayData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, color: '#E2E8F0', margin: 0 }}>BENEFICIARIES</h1>
          <p style={{ color: '#64748B', fontSize: 13, margin: '6px 0 0', fontFamily: 'JetBrains Mono' }}>
            {searchRes ? `${searchRes.length} search results` : `${data.length} total records`} · showing {pageData.length} on this page
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search name or Aadhar…"
              style={{ width: 260, paddingLeft: 36 }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#64748B' }}>⌕</span>
            {searching && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#F97316' }}>…</span>}
            {search && (
              <button onClick={() => { setSearch(''); setSearchRes(null) }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}>×</button>
            )}
          </div>
          <select value={eligFilter} onChange={e => { setEligFilter(e.target.value); setPage(0) }} style={{ minWidth: 160 }}>
            <option value="">All Eligibility</option>
            <option value="eligible">Eligible</option>
            <option value="ineligible">Ineligible</option>
            <option value="under_review">Under Review</option>
          </select>
          <button onClick={() => setShowAdd(true)} style={{
            background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none',
            color: '#fff', borderRadius: 6, padding: '8px 18px',
            cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
            boxShadow: '0 0 15px rgba(249,115,22,0.3)',
          }}>+ ADD</button>
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
            borderRadius: 16, padding: 32, width: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontFamily: 'Space Mono', fontSize: 14, color: '#E2E8F0', marginBottom: 24, fontWeight: 700 }}>ADD BENEFICIARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Name', 'name', 'text', 'Full Name'],
                ['Family ID', 'family_id', 'number', '1'],
                ['Aadhar (12 digits)', 'aadhar_number', 'text', '123456789012'],
                ['Date of Birth', 'dob', 'date', ''],
                ['Contact', 'contact', 'text', '+91 98765 43210'],
              ].map(([label, key, type, placeholder]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 10, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={{ width: '100%' }}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Slum</label>
                <select value={form.slum_id} onChange={e => setForm({ ...form, slum_id: e.target.value })} style={{ width: '100%' }}>
                  <option value="">Select slum...</option>
                  {slums.map(s => <option key={s.slum_id} value={s.slum_id}>{s.slum_name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontFamily: 'Space Mono', color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Eligibility</label>
                <select value={form.eligibility_status} onChange={e => setForm({ ...form, eligibility_status: e.target.value })} style={{ width: '100%' }}>
                  <option value="under_review">Under Review</option>
                  <option value="eligible">Eligible</option>
                  <option value="ineligible">Ineligible</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}>
                <input type="checkbox" id="hof" checked={form.is_head_of_family}
                  onChange={e => setForm({ ...form, is_head_of_family: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#F97316' }} />
                <label htmlFor="hof" style={{ fontSize: 13, color: '#94A3B8' }}>Head of Family</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM) }} style={{
                background: 'transparent', border: '1px solid #1E2D45', color: '#64748B',
                borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11,
              }}>CANCEL</button>
              <button onClick={handleCreate} disabled={saving} style={{
                background: 'linear-gradient(135deg, #F97316, #EA580C)', border: 'none',
                color: '#fff', borderRadius: 6, padding: '8px 20px',
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700,
              }}>{saving ? 'SAVING...' : 'CREATE'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="card-glow" style={{ background: '#141D2E', border: '1px solid #1E2D45', borderRadius: 12, overflow: 'hidden' }}>
        {loading && !searchRes ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>LOADING...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Aadhar</th><th>Family</th><th>Gender</th>
                    <th>Slum</th><th>Head</th><th>Eligibility</th><th>Flat</th><th>Lock-in Ends</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map(b => (
                    <tr key={b.beneficiary_id}>
                      <td style={{ color: '#64748B', fontFamily: 'JetBrains Mono', fontSize: 11 }}>#{b.beneficiary_id}</td>
                      <td style={{ fontWeight: 500 }}>{b.name}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>{b.aadhar_number}</td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>{b.family_id}</td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{b.gender}</td>
                      <td style={{ fontSize: 12 }}>{b.slum_name}</td>
                      <td>{b.is_head_of_family ? <span style={{ color: '#F97316' }}>★</span> : <span style={{ color: '#334155' }}>—</span>}</td>
                      <td><span className={`badge badge-${b.eligibility_status}`}>{b.eligibility_status?.replace(/_/g,' ')}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11 }}>
                        {b.flat_number ? <span style={{ color: '#06B6D4' }}>{b.flat_number}</span> : <span style={{ color: '#334155' }}>—</span>}
                      </td>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>
                        {b.lock_in_end_date ? new Date(b.lock_in_end_date).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        <button onClick={() => handleDelete(b.beneficiary_id, b.name)} style={{
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#EF4444', borderRadius: 5, padding: '4px 10px',
                          cursor: 'pointer', fontSize: 11, fontFamily: 'Space Mono',
                        }}>DEL</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {displayData.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontFamily: 'Space Mono', fontSize: 12 }}>
                  {searchRes !== null ? 'NO RESULTS' : 'NO RECORDS FOUND'}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderTop: '1px solid #1E2D45',
              }}>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'JetBrains Mono' }}>
                  Page {page + 1} of {totalPages} · {displayData.length} total records
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPage(0)} disabled={page === 0} style={pageBtnStyle(page === 0)}>«</button>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0} style={pageBtnStyle(page === 0)}>‹ Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                    return (
                      <button key={p} onClick={() => setPage(p)} style={{
                        ...pageBtnStyle(false),
                        background: p === page ? 'rgba(249,115,22,0.2)' : 'transparent',
                        color: p === page ? '#F97316' : '#94A3B8',
                        borderColor: p === page ? 'rgba(249,115,22,0.4)' : '#1E2D45',
                      }}>{p + 1}</button>
                    )
                  })}
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} style={pageBtnStyle(page >= totalPages - 1)}>Next ›</button>
                  <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} style={pageBtnStyle(page >= totalPages - 1)}>»</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const pageBtnStyle = (disabled) => ({
  background: 'transparent',
  border: '1px solid #1E2D45',
  color: disabled ? '#334155' : '#94A3B8',
  borderRadius: 5, padding: '5px 10px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontFamily: 'Space Mono, monospace', fontSize: 11,
  transition: 'all 0.2s',
})
