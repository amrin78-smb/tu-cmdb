'use client'
import { SessionProvider } from 'next-auth/react'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ── Toast ──────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }
type ToastCtx = { showToast: (message: string, type?: ToastType) => void }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} })
export const useToast = () => useContext(ToastContext)

// ── Confirm Modal ──────────────────────────────────────────────
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; danger?: boolean }
type ConfirmCtx = { confirm: (options: ConfirmOptions) => Promise<boolean> }

const ConfirmContext = createContext<ConfirmCtx>({ confirm: async () => false })
export const useConfirm = () => useContext(ConfirmContext)

export default function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ options, resolve })
    })
  }, [])

  function handleConfirm(result: boolean) {
    confirmState?.resolve(result)
    setConfirmState(null)
  }

  const toastColors: Record<ToastType, { bg: string; color: string; border: string; icon: string }> = {
    success: { bg: '#f0fdf4', color: '#166534', border: '#86efac', icon: '✓' },
    error:   { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5', icon: '✕' },
    info:    { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', icon: 'i' },
  }

  return (
    <SessionProvider>
      <ToastContext.Provider value={{ showToast }}>
        <ConfirmContext.Provider value={{ confirm }}>
          {children}

          {/* Toast container */}
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
            {toasts.map(toast => {
              const c = toastColors[toast.type]
              return (
                <div key={toast.id} style={{
                  background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                  borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: '500',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px',
                  minWidth: '260px', maxWidth: '380px', pointerEvents: 'auto',
                  animation: 'slideInToast 0.2s ease-out'
                }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
                    {c.icon}
                  </span>
                  {toast.message}
                </div>
              )
            })}
          </div>

          {/* Confirm modal */}
          {confirmState && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>{confirmState.options.title}</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px', lineHeight: '1.5' }}>{confirmState.options.message}</p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleConfirm(false)} style={{ padding: '8px 18px', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '7px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleConfirm(true)} style={{ padding: '8px 18px', background: confirmState.options.danger ? '#C8102E' : '#1a2744', color: 'white', border: 'none', borderRadius: '7px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    {confirmState.options.confirmLabel || 'Confirm'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </SessionProvider>
  )
}
