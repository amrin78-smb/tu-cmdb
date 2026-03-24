import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const [siteRes, devicesRes] = await Promise.all([
    query(`
      SELECT s.id, s.name as site, s.code,
             c.name as country, c.iso_code, r.name as region
      FROM sites s
      JOIN countries c ON c.id = s.country_id
      JOIN regions r ON r.id = c.region_id
      WHERE s.id = $1
    `, [id]),
    query(`
      SELECT * FROM v_devices_flat WHERE site_id = $1
      ORDER BY device_type, name
    `, [id]),
  ])

  if (!siteRes.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ site: siteRes.rows[0], devices: devicesRes.rows })
}
