import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const duplicates: { field: string; value: string; count: number; device_ids: string[] }[] = []

  // Check duplicate IP addresses (ignore null/empty)
  const ipDups = await query(`
    SELECT ip_address::text AS value, COUNT(*) AS count,
           array_agg(id::text) AS device_ids
    FROM devices
    WHERE ip_address IS NOT NULL
    GROUP BY ip_address
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `)
  for (const row of ipDups.rows) {
    duplicates.push({ field: 'IP Address', value: row.value, count: parseInt(row.count), device_ids: row.device_ids })
  }

  // Check duplicate serial numbers (ignore null/empty)
  const snDups = await query(`
    SELECT serial_number AS value, COUNT(*) AS count,
           array_agg(id::text) AS device_ids
    FROM devices
    WHERE serial_number IS NOT NULL AND serial_number != ''
    GROUP BY serial_number
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `)
  for (const row of snDups.rows) {
    duplicates.push({ field: 'Serial Number', value: row.value, count: parseInt(row.count), device_ids: row.device_ids })
  }

  return NextResponse.json({ duplicates })
}
