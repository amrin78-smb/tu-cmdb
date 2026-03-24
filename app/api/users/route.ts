import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const res = await query('SELECT id, name, email, role, created_at FROM users ORDER BY name')
  return NextResponse.json(res.rows)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  if (!body.email || !body.password || !body.name)
    return NextResponse.json({ error: 'Name, email and password required' }, { status: 400 })
  const hash = await bcrypt.hash(body.password, 12)
  try {
    const res = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role',
      [body.name, body.email.toLowerCase(), hash, body.role || 'viewer'])
    return NextResponse.json(res.rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
  }
}
