'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Summary = { total: string; active: string; decommed: string; spare: string; eol: string; supported: string; unknown_lifecycle: string }
type RegionRow = { region: string; total: string; eol_count: string }
type TypeRow = { device_type: string; total: string }
type EolRow = { site: string; country: string; region: string; eol_count: string; total_count: string }
type ActivityRow = { field_name: string; changed_at: string; changed_by: string; device_name: string }

export default function DashboardPage() {
  const [data, setData] = useState<{ summary: Summary; byRegion: RegionRow[]; byType: TypeRow[]; topEol: EolRow[]; recentActivity: ActivityRow[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading dashboard...</div>
  )
  if (!data) return null

  const { summary, byRegion, byType, topEol, recentActivity } = data
  const total = parseInt(summary.total)
  const eol = parseInt(summary.eol)
  const eolPct = total > 0 ? Math.round((eol / total) * 100) : 0
  const maxType = Math.max(...byType.map(t => parseInt(t.total)))
  const maxEol = topEol.length > 0 ? parseInt(topEol[0].eol_count) : 1

  const actColor: Record<string, string> = { created: '#166534', updated: '#075985', deleted: '#991b1b' }
  const actBg: Record<string, string> = { created: '#dcfce7', updated: '#e0f2fe', deleted: '#fee2e2' }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: '700', color }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: eolPct >= 25 && label === 'EOL / EOS' ? '#991b1b' : '#9ca3af', marginTop: '2px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>Thai Union network infrastructure overview</p>
        </div>
        <Link href="/devices">
          <button style={{ padding: '7px 14px', background: '#1a2744', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>View all devices →</button>
        </Link>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total devices" value={parseInt(summary.total).toLocaleString()} sub={`across ${byRegion.length} regions`} color="#1a2744" />
        <StatCard label="Active" value={parseInt(summary.active).toLocaleString()} sub={`${Math.round(parseInt(summary.active)/total*100)}% of fleet`} color="#166534" />
        <StatCard label="EOL / EOS" value={eol.toLocaleString()} sub={`${eolPct}%${eolPct >= 25 ? ' — action needed' : ' of fleet'}`} color="#991b1b" />
        <StatCard label="Decommed" value={parseInt(summary.decommed).toLocaleString()} sub="pending removal" color="#92400e" />
        <StatCard label="Spare" value={parseInt(summary.spare).toLocaleString()} sub="in storage" color="#075985" />
      </div>

      {/* Region + Device type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* By region */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Devices by region</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${byRegion.length}, 1fr)`, gap: '10px', marginBottom: '16px' }}>
            {byRegion.map(r => (
              <div key={r.region} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.region}</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a2744' }}>{parseInt(r.total).toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '2px' }}>{parseInt(r.eol_count).toLocaleString()} EOL</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px' }}>EOL % by region</div>
          {byRegion.map(r => {
            const pct = Math.round(parseInt(r.eol_count) / parseInt(r.total) * 100)
            return (
              <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#374151', width: '50px' }}>{r.region}</span>
                <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: pct >= 40 ? '#C8102E' : pct >= 20 ? '#f59e0b' : '#22c55e' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', width: '32px', textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>

        {/* By device type */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Devices by type</div>
          {byType.map(t => {
            const pct = Math.round(parseInt(t.total) / maxType * 100)
            return (
              <div key={t.device_type} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#374151', width: '120px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.device_type}</span>
                <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: '#1a2744' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280', width: '36px', textAlign: 'right' }}>{parseInt(t.total).toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top EOL sites + Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Top EOL sites */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top sites by EOL devices</div>
            <Link href="/eol" style={{ fontSize: '12px', color: '#C8102E', textDecoration: 'none' }}>View full report →</Link>
          </div>
          {topEol.map(row => {
            const pct = Math.round(parseInt(row.eol_count) / maxEol * 100)
            const barColor = pct >= 70 ? '#C8102E' : pct >= 40 ? '#f59e0b' : '#6b7280'
            return (
              <div key={`${row.site}-${row.region}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '140px', flexShrink: 0 }}>
                  <div style={{ fontSize: '12px', color: '#111827', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.site}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af' }}>{row.country} · {row.region}</div>
                </div>
                <div style={{ flex: 1, height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: '4px', background: barColor }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#991b1b', width: '36px', textAlign: 'right' }}>{row.eol_count}</span>
              </div>
            )
          })}
        </div>

        {/* Recent activity */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recent activity</div>
            <Link href="/audit" style={{ fontSize: '12px', color: '#C8102E', textDecoration: 'none' }}>View all →</Link>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No activity yet</div>
          ) : recentActivity.map((log, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: '10px', marginBottom: '10px', borderBottom: i < recentActivity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: actColor[log.field_name] || '#9ca3af', flexShrink: 0, marginTop: '4px' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ background: actBg[log.field_name] || '#f3f4f6', color: actColor[log.field_name] || '#374151', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: '500', marginRight: '6px' }}>{log.field_name}</span>
                  {log.device_name || 'Unknown device'}
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{log.changed_by || 'System'} · {timeAgo(log.changed_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
