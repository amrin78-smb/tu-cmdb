import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const res = await query(`
    SELECT a.field_name, a.old_value, a.new_value, a.changed_at,
           u.name as changed_by_name, u.email as changed_by_email
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.changed_by
    WHERE a.device_id = $1
    ORDER BY a.changed_at DESC
    LIMIT 20
  `, [id])
  return NextResponse.json({ logs: res.rows })
}
