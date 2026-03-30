import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string }
  if (user.role !== 'admin' && user.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 50
  const offset = (page - 1) * limit
  const res = await query(`
    SELECT a.id, a.field_name, a.old_value, a.new_value, a.changed_at,
           u.name as changed_by_name, u.email as changed_by_email,
           d.name as device_name
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.changed_by
    LEFT JOIN devices d ON d.id = a.device_id
    ORDER BY a.changed_at DESC LIMIT $1 OFFSET $2
  `, [limit, offset])
  const count = await query('SELECT COUNT(*) FROM audit_log')
  return NextResponse.json({ logs: res.rows, total: parseInt(count.rows[0].count) })
}
