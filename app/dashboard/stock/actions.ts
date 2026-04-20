'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { movementSchema, type MovementFormValues } from '@/lib/schemas/movement'
import { format } from 'date-fns'

export async function exportStockLevelsCSV(): Promise<{ csv: string | null; filename: string; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('name, sku, unit, low_stock_threshold, stock_levels(quantity)')
    .eq('is_active', true)
    .order('name')

  if (error) return { csv: null, filename: '', error: error.message }

  const rows = [
    ['Product', 'SKU', 'Unit', 'Quantity', 'Low Stock Threshold', 'Status'],
    ...(data ?? []).map((p) => {
      const quantity = (p.stock_levels as { quantity: number } | null)?.quantity ?? 0
      const status = quantity === 0 ? 'Out of stock' : quantity < p.low_stock_threshold ? 'Low stock' : 'OK'
      return [
        p.name,
        p.sku,
        p.unit,
        String(quantity),
        String(p.low_stock_threshold),
        status,
      ]
    }),
  ]

  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const filename = `stock-levels-${format(new Date(), 'yyyy-MM-dd')}.csv`

  return { csv, filename, error: null }
}

export async function createMovement(
  values: MovementFormValues
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const parsed = movementSchema.parse(values)

  if (parsed.movement_type === 'dispatch' || parsed.movement_type === 'adjustment') {
    const { data: level } = await supabase
      .from('stock_levels')
      .select('quantity')
      .eq('product_id', parsed.product_id)
      .single()

    const available = level?.quantity ?? 0
    if (parsed.quantity > available) {
      return { error: `Insufficient stock — only ${available} unit(s) available` }
    }
  }

  const { error } = await supabase.from('stock_movements').insert({
    ...parsed,
    created_by: user.id,
    client_id: parsed.client_id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stock')
  return { error: null }
}
