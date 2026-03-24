import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [summary, byRegion, byType, topEol, recentActivity] = await Promise.all([
    query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE device_status = 'Active') as active,
        COUNT(*) FILTER (WHERE device_status = 'Decommed') as decommed,
        COUNT(*) FILTER (WHERE device_status = 'Spare') as spare,
        COUNT(*) FILTER (WHERE lifecycle_status = 'EOL / EOS') as eol,
        COUNT(*) FILTER (WHERE lifecycle_status = 'Active, Supported') as supported,
        COUNT(*) FILTER (WHERE lifecycle_status = 'Unknown') as unknown_lifecycle
      FROM v_devices_flat
    `),
    query(`
      SELECT
        region,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE lifecycle_status = 'EOL / EOS') as eol_count
      FROM v_devices_flat
      WHERE region IS NOT NULL
      GROUP BY region
      ORDER BY total DESC
    `),
    query(`
      SELECT
        device_type,
        COUNT(*) as total
      FROM v_devices_flat
      WHERE device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY total DESC
      LIMIT 8
    `),
    query(`
      SELECT
        site,
        country,
        region,
        COUNT(*) FILTER (WHERE lifecycle_status = 'EOL / EOS') as eol_count,
        COUNT(*) as total_count
      FROM v_devices_flat
      WHERE lifecycle_status = 'EOL / EOS'
      GROUP BY site, country, region
      ORDER BY eol_count DESC
      LIMIT 8
    `),
    query(`
      SELECT
        a.field_name,
        a.changed_at,
        u.name as changed_by,
        d.name as device_name
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.changed_by
      LEFT JOIN devices d ON d.id = a.device_id
      ORDER BY a.changed_at DESC
      LIMIT 6
    `),
  ])

  return NextResponse.json({
    summary: summary.rows[0],
    byRegion: byRegion.rows,
    byType: byType.rows,
    topEol: topEol.rows,
    recentActivity: recentActivity.rows,
  })
}
