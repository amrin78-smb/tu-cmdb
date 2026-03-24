import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string; id: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { ids, field, value } = await req.json()
  if (!ids?.length || !field || value === undefined)
    return NextResponse.json({ error: 'ids, field and value required' }, { status: 400 })
  const allowed = ['device_status', 'lifecycle_status']
  if (!allowed.includes(field))
    return NextResponse.json({ error: 'Field not allowed for bulk update' }, { status: 400 })
  const placeholders = ids.map((_: any, i: number) => `$${i + 2}`).join(',')
  await query(
    `UPDATE devices SET ${field} = $1, updated_by = $${ids.length + 2} WHERE id IN (${placeholders})`,
    [value, ...ids, parseInt(user.id)]
  )
  for (const id of ids) {
    await query(
      `INSERT INTO audit_log (device_id, changed_by, field_name, old_value, new_value) VALUES ($1,$2,$3,NULL,$4)`,
      [id, parseInt(user.id), `bulk_${field}`, value]
    )
  }
  return NextResponse.json({ updated: ids.length })
}
