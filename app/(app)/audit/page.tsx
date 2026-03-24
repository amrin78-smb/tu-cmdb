'use client'
import { useState, useEffect } from 'react'
type Log = { id: string; field_name: string; changed_at: string; changed_by_name: string; changed_by_email: string; device_name: string }

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/audit?page=${page}`).then(r => r.json()).then(d => { setLogs(d.logs || []); setTotal(d.total || 0); setLoading(false) })
  }, [page])

  const actionColor: Record<string, string> = { created: '#166534', updated: '#075985', deleted: '#991b1b' }
  const actionBg: Record<string, string> = { created: '#dcfce7', updated: '#e0f2fe', deleted: '#fee2e2' }

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Audit log</h1>
        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Full history of all changes — {total.toLocaleString()} entries</p>
      </div>
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div> : logs.length === 0 ? <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No audit records yet</div> : (
          <table>
            <thead><tr><th>When</th><th>Action</th><th>Device</th><th>Changed by</th></tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(log.changed_at).toLocaleString()}</td>
                  <td><span className="badge" style={{ background: actionBg[log.field_name] || '#f3f4f6', color: actionColor[log.field_name] || '#374151' }}>{log.field_name}</span></td>
                  <td style={{ fontWeight: '500', color: '#111827' }}>{log.device_name || '—'}</td>
                  <td style={{ fontSize: '12px' }}>
                    <div style={{ fontWeight: '500' }}>{log.changed_by_name}</div>
                    <div style={{ color: '#9ca3af' }}>{log.changed_by_email}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > 50 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Page {page} of {Math.ceil(total/50)}</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => setPage(p => p-1)} disabled={page===1}>← Prev</button>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/50)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
