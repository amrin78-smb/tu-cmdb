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
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2744 0%, #2d3f6b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
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
        <div style={{ background: 'white', borderRadius: '12px', padding: '36px 40px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '6px', textAlign: 'center' }}>Sign in</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px', textAlign: 'center' }}>Network Device Inventory</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '7px', fontSize: '13px', marginBottom: '18px', textAlign: 'center' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '11px', background: '#C8102E', color: 'white', border: 'none', borderRadius: '7px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '24px' }}>
          Contact your IT admin to get access
        </p>
      </div>
    </div>
  )
}
