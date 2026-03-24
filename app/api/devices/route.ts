import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const region = searchParams.get('region') || ''
  const site = searchParams.get('site') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const lifecycle = searchParams.get('lifecycle') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const params: unknown[] = []
  let p = 1
  if (search) { conditions.push(`(name ILIKE $${p} OR ip_address::text ILIKE $${p} OR model ILIKE $${p} OR serial_number ILIKE $${p} OR site ILIKE $${p})`); params.push(`%${search}%`); p++ }
  if (region) { conditions.push(`region = $${p}`); params.push(region); p++ }
  if (site) { conditions.push(`site = $${p}`); params.push(site); p++ }
  if (type) { conditions.push(`device_type = $${p}`); params.push(type); p++ }
  if (status) { conditions.push(`device_status = $${p}`); params.push(status); p++ }
  if (lifecycle) { conditions.push(`lifecycle_status = $${p}`); params.push(lifecycle); p++ }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countRes = await query(`SELECT COUNT(*) FROM v_devices_flat ${where}`, params)
  const total = parseInt(countRes.rows[0].count)
  const dataRes = await query(
    `SELECT * FROM v_devices_flat ${where} ORDER BY region, country, site, name LIMIT $${p} OFFSET $${p + 1}`,
    [...params, limit, offset])
  return NextResponse.json({ devices: dataRes.rows, total, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = session.user as { role: string; id: string }
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const res = await query(`
    INSERT INTO devices (
      name, brand_id, model, serial_number, device_type_id,
      ip_address, mgmt_protocol, mgmt_url, site_id, location_detail,
      lifecycle_status, device_status, risk_score, technical_debt, remark,
      cost, purchase_date, purchase_vendor_id, ma_vendor_id, created_by, updated_by
    ) VALUES (
      $1,(SELECT id FROM brands WHERE name=$2),$3,$4,
      (SELECT id FROM device_types WHERE name=$5),
      $6,$7,$8,(SELECT id FROM sites WHERE name=$9),
      $10,$11,$12,$13,$14,$15,$16,$17,
      (SELECT id FROM vendors WHERE name=$18),
      (SELECT id FROM vendors WHERE name=$19),
      $20,$20
    ) RETURNING id`,
    [body.name,body.brand,body.model,body.serial_number,body.device_type,
     body.ip_address||null,body.mgmt_protocol||null,body.mgmt_url||null,
     body.site,body.location_detail||null,
     body.lifecycle_status||'Unknown',body.device_status||'Active',
     body.risk_score||null,body.technical_debt||null,body.remark||null,
     body.cost||null,body.purchase_date||null,
     body.purchase_vendor||null,body.ma_vendor||null,parseInt(user.id)])
  await query(
    `INSERT INTO audit_log (device_id, changed_by, field_name, old_value, new_value) VALUES ($1,$2,'created',NULL,$3)`,
    [res.rows[0].id, parseInt(user.id), JSON.stringify(body)])
  return NextResponse.json({ id: res.rows[0].id }, { status: 201 })
}
