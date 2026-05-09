'use server'

import { format } from 'date-fns'
import { protectedAction } from '@/lib/auth-helpers'
import { ADJUSTMENT_REASONS } from '@/lib/schemas/movement'

export async function exportMovementsCSV(
  from: string,
  to: string
): Promise<{ csv: string | null; error: string | null }> {
  return protectedAction(async ({ supabase, user }) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const isAdmin = profile?.role === 'admin'

    const adminQuery = supabase
      .from('stock_movements')
      .select('created_at, movement_type, quantity, note, adjustment_reason, products(name, unit_price), profiles(full_name), clients(company_name, rep_id)')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`)
      .order('created_at', { ascending: false })

    const staffQuery = supabase
      .from('stock_movements')
      .select('created_at, movement_type, quantity, note, adjustment_reason, products(name), profiles(full_name), clients(company_name)')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`)
      .order('created_at', { ascending: false })

    const { data, error } = isAdmin ? await adminQuery : await staffQuery

    if (error) return { csv: null, error: error.message }

    // Build rep_id → { name, commission_per_unit } map for admin CSVs
    const repInfo = new Map<string, { name: string; rate: number }>()
    if (isAdmin) {
      const repIds = Array.from(
        new Set(
          (data ?? [])
            .map((m) => (m.clients as { rep_id?: string | null } | null)?.rep_id)
            .filter((id): id is string => !!id)
        )
      )
      if (repIds.length > 0) {
        const { data: reps } = await supabase
          .from('profiles')
          .select('id, full_name, commission_per_unit')
          .in('id', repIds)
        for (const r of reps ?? []) {
          repInfo.set(r.id, {
            name: r.full_name ?? '',
            rate: Number(r.commission_per_unit),
          })
        }
      }
    }

    const header = isAdmin
      ? ['Date', 'Product', 'Type', 'Quantity', 'Unit Price (ZAR)', 'Line Total (ZAR)', 'Rep', 'Commission (ZAR)', 'Reason', 'Note', 'Client', 'Recorded By']
      : ['Date', 'Product', 'Type', 'Quantity', 'Reason', 'Note', 'Client', 'Recorded By']

    const rows = [
      header,
      ...(data ?? []).map((m) => {
        const reason = ADJUSTMENT_REASONS.find((r) => r.value === m.adjustment_reason)?.label ?? ''
        const date = format(new Date(m.created_at), 'yyyy/MM/dd, HH:mm:ss')
        const productName = (m.products as { name: string } | null)?.name ?? ''
        const clientName = (m.clients as { company_name: string } | null)?.company_name ?? ''
        const recorder = (m.profiles as { full_name: string | null } | null)?.full_name ?? ''

        if (isAdmin) {
          const unitPrice = Number(
            (m.products as { unit_price?: number | string } | null)?.unit_price ?? 0
          )
          const lineTotal = m.movement_type === 'dispatch' ? m.quantity * unitPrice : 0
          const repId = (m.clients as { rep_id?: string | null } | null)?.rep_id ?? null
          const rep = repId ? repInfo.get(repId) : undefined
          const repName = rep?.name ?? ''
          const commission = rep && m.movement_type === 'dispatch'
            ? m.quantity * rep.rate
            : 0
          return [
            date,
            productName,
            m.movement_type,
            String(m.quantity),
            unitPrice.toFixed(2),
            lineTotal.toFixed(2),
            repName,
            commission.toFixed(2),
            m.movement_type === 'adjustment' ? reason : '',
            m.note ?? '',
            clientName,
            recorder,
          ]
        }

        return [
          date,
          productName,
          m.movement_type,
          String(m.quantity),
          m.movement_type === 'adjustment' ? reason : '',
          m.note ?? '',
          clientName,
          recorder,
        ]
      }),
    ]

    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')

    return { csv, error: null }
  })
}
