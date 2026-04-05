'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { movementSchema, type MovementFormValues } from '@/lib/schemas/movement'

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
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stock')
  return { error: null }
}
