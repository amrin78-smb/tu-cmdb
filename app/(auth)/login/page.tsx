'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) {
      router.push('/devices')
    } else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2744 0%, #2d3f6b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#C8102E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>TU CMDB</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Thai Union Group</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Sign in</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>Network Device Inventory</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: '15px' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '24px' }}>Contact your IT admin to get access</p>
      </div>
    </div>
  )
}
