'use client'
import { useEffect, useState } from 'react'
import DeviceForm from '@/components/DeviceForm'
export default function EditDevicePage({ params }: { params: { id: string } }) {
  const [device, setDevice] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/devices/${params.id}`).then(r => r.json()).then(d => { setDevice(d); setLoading(false) })
  }, [params.id])
  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
  if (!device) return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Device not found</div>
  return <DeviceForm initialData={device} deviceId={params.id} />
}
