'use server'

import { createClient } from '@/lib/supabase/server'
import { ADJUSTMENT_REASONS } from '@/lib/schemas/movement'

export async function exportMovementsCSV(
  from: string,
  to: string
): Promise<{ csv: string | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_movements')
    .select('created_at, movement_type, quantity, note, adjustment_reason, products(name), profiles(full_name), clients(company_name)')
    .gte('created_at', `${from}T00:00:00`)
    .lte('created_at', `${to}T23:59:59`)
    .order('created_at', { ascending: false })

  if (error) return { csv: null, error: error.message }

  const rows = [
    ['Date', 'Product', 'Type', 'Quantity', 'Reason', 'Note', 'Client', 'Recorded By'],
    ...(data ?? []).map((m) => {
      const reason = ADJUSTMENT_REASONS.find((r) => r.value === m.adjustment_reason)?.label ?? ''
      return [
        new Date(m.created_at).toLocaleString('en-ZA'),
        (m.products as { name: string } | null)?.name ?? '',
        m.movement_type,
        String(m.quantity),
        m.movement_type === 'adjustment' ? reason : '',
        m.note ?? '',
        (m.clients as { company_name: string } | null)?.company_name ?? '',
        (m.profiles as { full_name: string | null } | null)?.full_name ?? '',
      ]
    }),
  ]

  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')

  return { csv, error: null }
}
