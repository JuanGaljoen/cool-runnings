'use server'

import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { protectedAction, validate } from '@/lib/auth-helpers'
import { movementSchema, type MovementFormValues } from '@/lib/schemas/movement'

export async function exportStockLevelsCSV(): Promise<{ csv: string | null; filename: string; error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const { data, error } = await supabase
      .from('products')
      .select('name, sku, unit, low_stock_threshold, stock_levels(quantity)')
      .eq('is_active', true)
      .order('name')

    if (error) return { csv: null, filename: '', error: error.message }

    const rows = [
      ['Product', 'SKU', 'Unit', 'Quantity', 'Low Stock Threshold', 'Status'],
      ...(data ?? []).map((p) => {
        const sl = p.stock_levels as { quantity: number } | { quantity: number }[] | null
        const quantity = Array.isArray(sl) ? sl[0]?.quantity ?? 0 : sl?.quantity ?? 0
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
  })
}

export async function createMovement(
  values: MovementFormValues
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase, user }) => {
    const parsed = validate(movementSchema, values)
    if (!parsed.success) return { error: parsed.error }

    if (parsed.data.movement_type === 'dispatch' || parsed.data.movement_type === 'adjustment') {
      const { data: level } = await supabase
        .from('stock_levels')
        .select('quantity')
        .eq('product_id', parsed.data.product_id)
        .single()

      const available = level?.quantity ?? 0
      if (parsed.data.quantity > available) {
        return { error: `Insufficient stock — only ${available} unit(s) available` }
      }
    }

    const { error } = await supabase.from('stock_movements').insert({
      ...parsed.data,
      created_by: user.id,
      client_id: parsed.data.client_id ?? null,
    })

    if (error) {
      if (error.message.includes('stock_non_negative')) {
        return { error: 'Insufficient stock for this movement' }
      }
      return { error: error.message }
    }

    revalidatePath('/dashboard/stock')
    return { error: null }
  })
}
