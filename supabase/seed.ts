/**
 * Idempotent seed script for the Ice Inventory dev/test database.
 *
 * Run with:  npx tsx supabase/seed.ts
 *
 * Uses the service-role key (RLS-bypassing) from .env.local, so point that
 * file at a dev/test project — never production.
 *
 * Idempotency:
 *  - Products and clients are matched by name and only inserted when missing.
 *  - Stock movements are tagged with a "[seed]" note marker; if any seeded
 *    movements already exist the movement batch is skipped, so re-running the
 *    script will not keep inflating the ledger.
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

const log = (msg: string) => process.stdout.write(msg + '\n')

const SEED_NOTE = '[seed]'

// Deterministic pseudo-random so re-seeding a fresh DB looks the same.
let _s = 1337
const rand = () => {
  _s = (_s * 1103515245 + 12345) & 0x7fffffff
  return _s / 0x7fffffff
}
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)]

const NEW_PRODUCTS = [
  { name: 'Block Ice', unit: 'block', unit_price: 25, low_stock_threshold: 50 },
  { name: 'Crushed Ice', unit: 'kg', unit_price: 12, low_stock_threshold: 150 },
  { name: 'Ice Cubes 2kg', unit: 'bag', unit_price: 18, low_stock_threshold: 120 },
]

const NEW_CLIENTS = [
  { company_name: 'Vaal Fisheries', contact_name: 'Pieter Botha', phone: '016 555 0101' },
  { company_name: 'Riverside Spar', contact_name: 'Naledi Khumalo', phone: '016 555 0102' },
  { company_name: 'Three Rivers Hotel', contact_name: 'Sipho Dlamini', phone: '016 555 0103' },
  { company_name: 'Emfuleni Catering', contact_name: 'Anja Pretorius', phone: '016 555 0104' },
]

const ADJUSTMENT_REASONS = ['damaged', 'stocktake', 'write_off', 'theft', 'other'] as const

async function seedProducts(): Promise<void> {
  const { data: existing } = await sb.from('products').select('name')
  const have = new Set((existing ?? []).map((p) => p.name.toLowerCase()))
  const toInsert = NEW_PRODUCTS.filter((p) => !have.has(p.name.toLowerCase()))
  if (toInsert.length === 0) {
    log('products: nothing to add')
    return
  }
  const { error } = await sb.from('products').insert(toInsert.map((p) => ({ ...p, is_active: true })))
  if (error) throw error
  log(`products: added ${toInsert.length} (${toInsert.map((p) => p.name).join(', ')})`)
}

async function seedClients(repId: string | null): Promise<void> {
  const { data: existing } = await sb.from('clients').select('company_name')
  const have = new Set((existing ?? []).map((c) => c.company_name.toLowerCase()))
  const toInsert = NEW_CLIENTS.filter((c) => !have.has(c.company_name.toLowerCase()))
  if (toInsert.length === 0) {
    log('clients: nothing to add')
    return
  }
  // Assign roughly half of the new clients to the rep so commission reports populate.
  const rows = toInsert.map((c, i) => ({
    ...c,
    is_active: true,
    rep_id: repId && i % 2 === 0 ? repId : null,
  }))
  const { error } = await sb.from('clients').insert(rows)
  if (error) throw error
  log(`clients: added ${rows.length} (${rows.map((c) => c.company_name).join(', ')})`)
}

async function seedMovements(): Promise<void> {
  const { count } = await sb
    .from('stock_movements')
    .select('*', { count: 'exact', head: true })
    .ilike('note', `${SEED_NOTE}%`)
  if ((count ?? 0) > 0) {
    log(`movements: ${count} seeded rows already present, skipping`)
    return
  }

  const [{ data: products }, { data: clients }, { data: profiles }] = await Promise.all([
    sb.from('products').select('id,name').eq('is_active', true),
    sb.from('clients').select('id').eq('is_active', true),
    sb.from('profiles').select('id,role').in('role', ['admin', 'staff']),
  ])
  if (!products?.length || !clients?.length || !profiles?.length) {
    throw new Error('Need at least one product, client, and admin/staff profile before seeding movements')
  }

  type Row = {
    product_id: string
    created_by: string
    client_id: string | null
    movement_type: 'production' | 'dispatch' | 'adjustment'
    quantity: number
    adjustment_reason: string | null
    note: string
    created_at: string
  }
  const rows: Row[] = []
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  // Walk the last 30 days. Each weekday: a production run per product, then a
  // few dispatches, then the occasional adjustment. Productions are queued
  // before dispatches in insert order so the stock_non_negative check is safe.
  for (let d = 30; d >= 0; d--) {
    const date = new Date(now - d * DAY)
    const dow = date.getDay()
    if (dow === 0) continue // skip Sundays

    const at = (hour: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, randInt(0, 59)).toISOString()

    for (const p of products) {
      rows.push({
        product_id: p.id,
        created_by: pick(profiles).id,
        client_id: null,
        movement_type: 'production',
        quantity: randInt(150, 450),
        adjustment_reason: null,
        note: `${SEED_NOTE} morning run`,
        created_at: at(7),
      })
    }

    for (let i = 0; i < randInt(2, 5); i++) {
      rows.push({
        product_id: pick(products).id,
        created_by: pick(profiles).id,
        client_id: pick(clients).id,
        movement_type: 'dispatch',
        quantity: randInt(20, 140),
        adjustment_reason: null,
        note: `${SEED_NOTE} dispatch`,
        created_at: at(randInt(9, 16)),
      })
    }

    if (dow === 5) {
      rows.push({
        product_id: pick(products).id,
        created_by: pick(profiles).id,
        client_id: null,
        movement_type: 'adjustment',
        quantity: randInt(5, 30),
        adjustment_reason: pick([...ADJUSTMENT_REASONS]),
        note: `${SEED_NOTE} weekly stocktake`,
        created_at: at(17),
      })
    }
  }

  // Insert in chunks; keep insert order (chronological) so the trigger never
  // drives stock below zero.
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await sb.from('stock_movements').insert(rows.slice(i, i + 100))
    if (error) throw error
  }
  log(`movements: added ${rows.length} seeded rows across the last 30 days`)
}

async function main(): Promise<void> {
  await seedProducts()
  const { data: rep } = await sb.from('profiles').select('id').eq('role', 'rep').limit(1).maybeSingle()
  await seedClients(rep?.id ?? null)
  await seedMovements()

  const { data: levels } = await sb
    .from('stock_levels')
    .select('quantity, products(name)')
    .order('quantity', { ascending: false })
  log('\nstock levels after seed:')
  for (const l of levels ?? []) {
    // @ts-expect-error nested select shape
    log(`  ${l.products?.name ?? l.product_id}: ${l.quantity}`)
  }
  log('\nseed complete.')
}

main().catch((e) => {
  console.error('seed failed:', e)
  process.exit(1)
})
