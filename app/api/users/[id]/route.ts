import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 12)
    await query('UPDATE users SET name=$1,email=$2,role=$3,password_hash=$4 WHERE id=$5',
      [body.name, body.email.toLowerCase(), body.role, hash, params.id])
  } else {
    await query('UPDATE users SET name=$1,email=$2,role=$3 WHERE id=$4',
      [body.name, body.email.toLowerCase(), body.role, params.id])
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await query('DELETE FROM users WHERE id = $1', [params.id])
  return NextResponse.json({ success: true })
}
