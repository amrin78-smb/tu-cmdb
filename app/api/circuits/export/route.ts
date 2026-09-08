import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { query } from '@/lib/db'
import * as XLSX from 'xlsx'

/**
 * GET /api/circuits/export — the circuit inventory, honouring the same filters
 * the Circuits page has applied. Two formats via ?format= : csv (default) and
 * xlsx.
 *
 * CSV mirrors /api/export (devices): session-gated, friendly column names, dated
 * filename, Power BI-importable.
 *
 * XLSX uses the SheetJS 'xlsx' package that is ALREADY a direct dependency here
 * (it backs the device and site importers), so this adds no new package. See
 * app/api/sites/import/template/route.ts for the same write-a-workbook pattern,
 * including why the response body must be a Uint8Array rather than a Buffer.
 *
 * What xlsx buys over csv: Cost/Month arrives as a real NUMBER so Excel can SUM
 * and filter it, column widths are set, and there is no comma/quote/encoding
 * negotiation at all — which matters here because 68 of the 123 live rows carry
 * commas in their address or comment.
 *
 * SITE SCOPING IS LOAD-BEARING. The filter block below is deliberately identical
 * to GET /api/circuits: a `site_admin` sees only their assigned sites, and one
 * with no sites gets nothing. An export route that skipped this would hand a
 * scoped user the entire estate in one click — the same "fixed the reported
 * route, missed its sibling" trap CLAUDE.md warns about, which has already bitten
 * this suite more than once. If the list route's scoping ever changes, change it
 * here in the same commit.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sessionUser = session.user as { role: string; siteIds?: number[] }

  const { searchParams } = new URL(req.url)
  const search     = searchParams.get('search') || ''
  const isp        = searchParams.get('isp') || ''
  const usage      = searchParams.get('usage') || ''
  const technology = searchParams.get('technology') || ''
  const country    = searchParams.get('country') || ''
  const site       = searchParams.get('site') || ''
  const format     = searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv'

  const conditions: string[] = []
  const params: unknown[] = []
  let p = 1

  if (sessionUser.role === 'site_admin' && sessionUser.siteIds?.length) {
    conditions.push(`c.site_id = ANY($${p})`); params.push(sessionUser.siteIds); p++
  } else if (sessionUser.role === 'site_admin') {
    // No assigned sites → export an empty (header-only) file rather than 403,
    // so the button behaves consistently instead of appearing broken.
    return respond([], format)
  }

  if (search)     { conditions.push(`(c.circuit_id ILIKE $${p} OR c.isp ILIKE $${p} OR c.site_name_raw ILIKE $${p} OR s.name ILIKE $${p} OR c.public_subnet ILIKE $${p})`); params.push(`%${search}%`); p++ }
  if (site)       { conditions.push(`s.name = $${p}`);       params.push(site);       p++ }
  if (isp)        { conditions.push(`c.isp = $${p}`);        params.push(isp);        p++ }
  if (usage)      { conditions.push(`c.usage = $${p}`);      params.push(usage);      p++ }
  if (technology) { conditions.push(`c.technology = $${p}`); params.push(technology); p++ }
  if (country)    { conditions.push(`co.name = $${p}`);      params.push(country);    p++ }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const res = await query(`
    SELECT s.name AS site, s.code AS site_code, co.name AS country, r.name AS region,
           c.city, c.address, c.it_owner,
           c.isp, c.usage, c.circuit_id, c.product, c.technology, c.circuit_type,
           c.interface, c.max_speed, c.guaranteed_speed, c.public_subnet,
           c.currency, c.cost_month, c.contract_term, c.pingable, c.comment
    FROM circuits c
    LEFT JOIN sites s ON s.id = c.site_id
    LEFT JOIN countries co ON co.id = s.country_id
    LEFT JOIN regions r ON r.id = co.region_id
    ${where}
    ORDER BY co.name, s.name, c.usage
  `, params)

  return respond(res.rows, format)
}

// Column order and headers are the export contract — a spreadsheet someone has
// built formulas against should not shift because a column was added mid-list.
// Append new columns at the END.
const COLUMNS: [string, string][] = [
  ['site',             'Site'],
  ['site_code',        'Site Code'],
  ['country',          'Country'],
  ['region',           'Region'],
  ['city',             'City'],
  ['address',          'Address'],
  ['it_owner',         'IT Owner'],
  ['isp',              'ISP'],
  ['usage',            'Usage'],
  ['circuit_id',       'Circuit ID'],
  ['product',          'Product'],
  ['technology',       'Technology'],
  ['circuit_type',     'Circuit Type'],
  ['interface',        'Interface'],
  ['max_speed',        'Max Speed'],
  ['guaranteed_speed', 'Guaranteed Speed'],
  ['public_subnet',    'Public Subnet'],
  ['currency',         'Currency'],
  ['cost_month',       'Cost/Month'],
  ['contract_term',    'Contract Term'],
  ['pingable',         'Pingable'],
  ['comment',          'Comment'],
]

function respond(rows: Record<string, unknown>[], format: 'csv' | 'xlsx') {
  return format === 'xlsx' ? xlsxResponse(rows) : csvResponse(rows)
}

// Written as NUMBERS in xlsx rather than text, so Excel can total and filter
// them. pg returns numeric as a string, so this must be explicit — left as text
// the cells look identical but SUM silently returns 0.
const NUMERIC_COLS = new Set(['cost_month'])

function xlsxResponse(rows: Record<string, unknown>[]) {
  const header = COLUMNS.map(([, h]) => h)
  const body = rows.map(row =>
    COLUMNS.map(([col]) => {
      const v = row[col]
      if (v === null || v === undefined || v === '') return ''
      if (NUMERIC_COLS.has(col)) {
        const n = Number(v)
        return Number.isFinite(n) ? n : String(v)
      }
      return String(v)
    }),
  )

  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  // Width from the header and the widest value, capped so one long comment does
  // not push the sheet to an unusable width.
  ws['!cols'] = COLUMNS.map((_c, i) => {
    const widest = body.reduce((m, r) => Math.max(m, String(r[i] ?? '').length), 0)
    return { wch: Math.min(Math.max(header[i].length + 2, widest + 2), 48) }
  })
  // NOTE: no frozen header row. SheetJS's community build silently ignores
  // ws['!freeze'] — verified against 0.18.5 by writing a sheet and checking the
  // emitted XML for a <pane> element (absent; <cols> is present). Setting it
  // anyway would read as a working feature that does nothing.

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Circuits')

  const out = new Uint8Array(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer)
  const dateStr = new Date().toISOString().split('T')[0]
  return new NextResponse(out, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="NetVault_Circuits_${dateStr}.xlsx"`,
      'Content-Length': String(out.length),
      'Cache-Control': 'no-store',
    },
  })
}

function csvResponse(rows: Record<string, unknown>[]) {
  const esc = (v: unknown) => {
    const str = String(v ?? '')
    return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const body = [
    COLUMNS.map(([, header]) => header).join(','),
    ...rows.map(row => COLUMNS.map(([col]) => esc(row[col])).join(',')),
  ].join('\r\n')

  // UTF-8 BOM: without it Excel reads the file as the local ANSI codepage and
  // mangles non-ASCII site names (Douarnenez, Landivisiau, Quimper are fine, but
  // accented and Thai site names are not). The devices export predates this and
  // has the same latent issue.
  const dateStr = new Date().toISOString().split('T')[0]
  return new NextResponse('﻿' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="NetVault_Circuits_${dateStr}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
