'use client'
import { useEffect, useState } from 'react'
import DeviceForm from '@/components/DeviceForm'
export default function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setId(p.id)
      fetch(`/api/devices/${p.id}`).then(r => r.json()).then(d => { setDevice(d); setLoading(false) })
    })
  }, [params])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
  if (!device) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Device not found</div>
  return <DeviceForm initialData={device} deviceId={id} />
}
