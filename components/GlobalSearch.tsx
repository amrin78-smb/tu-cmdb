'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Result = { id: string; name: string; device_type: string; brand: string; model: string; ip_address: string; site: string; region: string; device_status: string; lifecycle_status: string }

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.results || [])
    setOpen(true)
    setActive(0)
    setLoading(false)
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(v), 200)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && results[active]) { navigate(results[active].id) }
  }

  function navigate(id: string) {
    setOpen(false); setQuery(''); setResults([])
    router.push(`/devices/${id}`)
  }

  const statusColor: Record<string, string> = { 'Active': '#166534', 'Decommed': '#4b5563', 'Spare': '#92400e', 'Faulty, Replaced': '#9a3412' }
  const statusBg: Record<string, string> = { 'Active': '#dcfce7', 'Decommed': '#f3f4f6', 'Spare': '#fef3c7', 'Faulty, Replaced': '#ffedd5' }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          ref={inputRef}
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search devices… (/)"
          style={{ width: '100%', padding: '7px 32px 7px 32px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '7px', color: 'white', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>...</div>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 999, overflow: 'hidden' }}>
          {results.map((r, i) => (
            <div key={r.id} onMouseDown={() => navigate(r.id)}
              style={{ padding: '10px 14px', cursor: 'pointer', background: i === active ? '#f9fafb' : 'white', borderBottom: i < results.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                  {r.device_type} · {r.brand} {r.model} · {r.site}
                  {r.ip_address && <span style={{ fontFamily: 'monospace' }}> · {r.ip_address}</span>}
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 7px', borderRadius: '20px', background: statusBg[r.device_status] || '#f3f4f6', color: statusColor[r.device_status] || '#374151', flexShrink: 0 }}>{r.device_status}</span>
            </div>
          ))}
          <div style={{ padding: '8px 14px', background: '#f9fafb', fontSize: '11px', color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
            ↑↓ navigate · Enter to open · Esc to close
          </div>
        </div>
      )}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', padding: '16px 14px', textAlign: 'center', fontSize: '13px', color: '#9ca3af', zIndex: 999 }}>
          No devices found for "{query}"
        </div>
      )}
    </div>
  )
}
