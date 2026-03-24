import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const isp = searchParams.get('isp') || ''
  const usage = searchParams.get('usage') || ''
  const technology = searchParams.get('technology') || ''
  const country = searchParams.get('country') || ''

  const conditions: string[] = []
  const params: unknown[] = []
  let p = 1
  if (search) { conditions.push(`(c.circuit_id ILIKE $${p} OR c.isp ILIKE $${p} OR c.site_name_raw ILIKE $${p} OR s.name ILIKE $${p} OR c.public_subnet ILIKE $${p})`); params.push(`%${search}%`); p++ }
  if (isp) { conditions.push(`c.isp = $${p}`); params.push(isp); p++ }
  if (usage) { conditions.push(`c.usage = $${p}`); params.push(usage); p++ }
  if (technology) { conditions.push(`c.technology = $${p}`); params.push(technology); p++ }
  if (country) { conditions.push(`co.name = $${p}`); params.push(country); p++ }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const res = await query(`
    SELECT c.*, s.name as site, s.code as site_code,
           co.name as country, r.name as region
    FROM circuits c
    LEFT JOIN sites s ON s.id = c.site_id
    LEFT JOIN countries co ON co.id = s.country_id
    LEFT JOIN regions r ON r.id = co.region_id
    ${where}
    ORDER BY co.name, s.name, c.usage
  `, params)

  return NextResponse.json(res.rows)
}
