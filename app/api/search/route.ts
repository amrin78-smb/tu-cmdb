import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  if (q.length < 2) return NextResponse.json({ results: [] })
  const res = await query(`
    SELECT id, name, device_type, brand, model, ip_address, site, region, device_status, lifecycle_status
    FROM v_devices_flat
    WHERE name ILIKE $1 OR ip_address::text ILIKE $1 OR model ILIKE $1 OR serial_number ILIKE $1 OR site ILIKE $1
    ORDER BY CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END, name
    LIMIT 8
  `, [`%${q}%`, `${q}%`])
  return NextResponse.json({ results: res.rows })
}
