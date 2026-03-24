'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '▤' },
  { href: '/devices', label: 'All devices', icon: '☰' },
  { href: '/eol', label: 'EOL / Risk', icon: '⚠' },
  { href: '/audit', label: 'Audit log', icon: '≡', adminOnly: true },
  { href: '/users', label: 'Users', icon: '◎', adminOnly: true },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</div>
    </div>
  )

  if (!session) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f8f8' }}>
      <div style={{ width: '220px', background: '#1a2744', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#C8102E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>TU CMDB</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Thai Union Group</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(item => {
            if (item.adminOnly && user?.role !== 'admin') return null
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '7px', marginBottom: '2px', background: active ? 'rgba(200,16,46,0.2)' : 'transparent', borderLeft: active ? '3px solid #C8102E' : '3px solid transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px', color: active ? '#f87171' : 'rgba(255,255,255,0.45)', width: '16px' }}>{item.icon}</span>
                  <span style={{ fontSize: '13px', fontWeight: active ? '500' : '400', color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>
        <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '10px 12px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#C8102E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', color: 'white', flexShrink: 0 }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{user?.role}</div>
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ width: '100%', padding: '5px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '5px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer' }}>
              Sign out
            </button>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  )
}
