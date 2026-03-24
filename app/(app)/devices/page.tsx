'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type Device = {
  id: string; name: string; brand: string; model: string; device_type: string
  ip_address: string; site: string; country: string; region: string
  lifecycle_status: string; device_status: string; serial_number: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { 'Active': 'badge-active', 'Decommed': 'badge-decommed', 'Faulty, Replaced': 'badge-faulty', 'Spare': 'badge-spare' }
  return <span className={`badge ${map[status] || 'badge-unknown'}`}>{status}</span>
}

function LifecycleBadge({ status }: { status: string }) {
  if (status === 'EOL / EOS') return <span className="badge badge-eol">EOL</span>
  if (status === 'Active, Supported') return <span className="badge badge-active">Supported</span>
  return <span className="badge badge-unknown">Unknown</span>
}

export default function DevicesPage() {
  const { data: session } = useSession()
  const user = session?.user as { role?: string } | undefined
  const isAdmin = user?.role === 'admin'
  const [devices, setDevices] = useState<Device[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [site, setSite] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [lifecycle, setLifecycle] = useState('')
  const [lookups, setLookups] = useState<{ regions: string[]; sites: {site:string;region:string}[]; deviceTypes: string[] }>({ regions: [], sites: [], deviceTypes: [] })
  const [stats, setStats] = useState({ total: 0, active: 0, eol: 0, decommed: 0 })

  useEffect(() => {
    fetch('/api/lookup').then(r => r.json()).then(setLookups)
    Promise.all([
      fetch('/api/devices?limit=1').then(r => r.json()),
      fetch('/api/devices?status=Active&limit=1').then(r => r.json()),
      fetch('/api/devices?lifecycle=EOL+%2F+EOS&limit=1').then(r => r.json()),
      fetch('/api/devices?status=Decommed&limit=1').then(r => r.json()),
    ]).then(([all, active, eol, decommed]) => {
      setStats({ total: all.total, active: active.total, eol: eol.total, decommed: decommed.total })
    })
  }, [])

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50', ...(search && { search }), ...(region && { region }), ...(site && { site }), ...(type && { type }), ...(status && { status }), ...(lifecycle && { lifecycle }) })
    const res = await fetch(`/api/devices?${params}`)
    const data = await res.json()
    setDevices(data.devices || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, region, site, type, status, lifecycle])

  useEffect(() => { fetchDevices() }, [fetchDevices])

  async function deleteDevice(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/devices/${id}`, { method: 'DELETE' })
    fetchDevices()
  }

  const totalPages = Math.ceil(total / 50)
  const filteredSites = region ? lookups.sites.filter((s: any) => s.region === region) : lookups.sites

  return (
    <div style={{ padding: '24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Network devices</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Thai Union EMEA · APAC · NAM</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={() => window.location.href='/api/export'} style={{ fontSize: '13px' }}>Export CSV</button>
          {isAdmin && <Link href="/devices/new"><button className="btn-primary">+ Add device</button></Link>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[{ label: 'Total devices', value: stats.total.toLocaleString(), color: '#1a2744' }, { label: 'Active', value: stats.active.toLocaleString(), color: '#166534' }, { label: 'EOL / EOS', value: stats.eol.toLocaleString(), color: '#991b1b' }, { label: 'Decommed', value: stats.decommed.toLocaleString(), color: '#92400e' }].map(s => (
          <div key={s.label} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: '1', minWidth: '200px', maxWidth: '320px' }} placeholder="Search name, IP, model, serial..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <select className="select" value={region} onChange={e => { setRegion(e.target.value); setSite(''); setPage(1) }}>
          <option value="">All regions</option>
          {lookups.regions.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="select" value={site} onChange={e => { setSite(e.target.value); setPage(1) }}>
          <option value="">All sites</option>
          {filteredSites.map((s: any) => <option key={s.site}>{s.site}</option>)}
        </select>
        <select className="select" value={type} onChange={e => { setType(e.target.value); setPage(1) }}>
          <option value="">All types</option>
          {lookups.deviceTypes.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="select" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {['Active','Decommed','Faulty, Replaced','Spare'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" value={lifecycle} onChange={e => { setLifecycle(e.target.value); setPage(1) }}>
          <option value="">All lifecycle</option>
          <option value="EOL / EOS">EOL / EOS</option>
          <option value="Active, Supported">Active, Supported</option>
          <option value="Unknown">Unknown</option>
        </select>
        {(search || region || site || type || status || lifecycle) && (
          <button className="btn-secondary" style={{ fontSize: '13px' }} onClick={() => { setSearch(''); setRegion(''); setSite(''); setType(''); setStatus(''); setLifecycle(''); setPage(1) }}>Clear</button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading devices...</div>
        ) : devices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No devices found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Brand / Model</th><th>IP address</th>
                  <th>Site</th><th>Region</th><th>Lifecycle</th><th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: '500', color: '#111827' }} title={d.name}>{d.name || '—'}</td>
                    <td>{d.device_type}</td>
                    <td title={`${d.brand} ${d.model}`}>{d.brand} {d.model}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{d.ip_address || '—'}</td>
                    <td>{d.site}</td>
                    <td><span style={{ fontSize: '11px', color: '#6b7280' }}>{d.region}</span></td>
                    <td><LifecycleBadge status={d.lifecycle_status} /></td>
                    <td><StatusBadge status={d.device_status} /></td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Link href={`/devices/${d.id}/edit`}>
                            <button style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '5px', background: 'white', cursor: 'pointer' }}>Edit</button>
                          </Link>
                          <button className="btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => deleteDevice(d.id, d.name)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>Showing {((page-1)*50)+1}–{Math.min(page*50, total)} of {total.toLocaleString()}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>← Prev</button>
              <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
