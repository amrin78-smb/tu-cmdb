import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string; id: string; siteIds?: number[] }
  if (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'site_admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { ids, field, value } = await req.json()
  if (!ids?.length || !field || value === undefined)
    return NextResponse.json({ error: 'ids, field and value required' }, { status: 400 })

  const allowed = ['device_status', 'lifecycle_status', 'site_id']
  if (!allowed.includes(field))
    return NextResponse.json({ error: 'Field not allowed for bulk update' }, { status: 400 })

  // Site admins can only bulk edit devices at their assigned sites
  if (user.role === 'site_admin' && user.siteIds?.length) {
    const deviceCheck = await query(
      `SELECT COUNT(*) FROM devices WHERE id = ANY($1) AND site_id != ALL($2)`,
      [ids, user.siteIds]
    )
    if (parseInt(deviceCheck.rows[0].count) > 0)
      return NextResponse.json({ error: 'You can only bulk edit devices at your assigned sites' }, { status: 403 })
  }

  const placeholders = ids.map((_: any, i: number) => `$${i + 2}`).join(',')
  const castValue = field === 'site_id' ? parseInt(value) : value

  await query(
    `UPDATE devices SET ${field} = $1, updated_by = $${ids.length + 2} WHERE id IN (${placeholders})`,
    [castValue, ...ids, parseInt(user.id)]
  )

  for (const id of ids) {
    await query(
      `INSERT INTO audit_log (device_id, changed_by, field_name, old_value, new_value) VALUES ($1,$2,$3,NULL,$4)`,
      [id, parseInt(user.id), `bulk_${field}`, String(value)]
    )
  }

  return NextResponse.json({ updated: ids.length })
}
