import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const region = searchParams.get('region') || ''
  const site = searchParams.get('site') || ''
  const status = searchParams.get('status') || ''
  const conditions: string[] = []
  const params: unknown[] = []
  let p = 1
  if (region) { conditions.push(`region = $${p}`); params.push(region); p++ }
  if (site) { conditions.push(`site = $${p}`); params.push(site); p++ }
  if (status) { conditions.push(`device_status = $${p}`); params.push(status); p++ }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const res = await query(
    `SELECT name, brand, model, serial_number, device_type, ip_address,
            mgmt_protocol, site, location_detail, country, region,
            lifecycle_status, device_status, risk_score, technical_debt,
            remark, cost, purchase_date, purchase_vendor, ma_vendor
     FROM v_devices_flat ${where} ORDER BY region, country, site, name`, params)
  const headers = Object.keys(res.rows[0] || {})
  const csv = [
    headers.join(','),
    ...res.rows.map(row => headers.map(h => {
      const val = row[h] ?? ''
      return String(val).includes(',') ? `"${val}"` : val
    }).join(','))
  ].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="TU_CMDB_Export_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
