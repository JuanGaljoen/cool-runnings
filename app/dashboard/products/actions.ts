'use server'

import { revalidatePath } from 'next/cache'
import { protectedAction, validate } from '@/lib/auth-helpers'
import { productSchema, type ProductFormValues } from '@/lib/schemas/product'

export async function createProduct(
  values: ProductFormValues
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const parsed = validate(productSchema, values)
    if (!parsed.success) return { error: parsed.error }

    const { error } = await supabase.from('products').insert(parsed.data)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    return { error: null }
  })
}

export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const parsed = validate(productSchema, values)
    if (!parsed.success) return { error: parsed.error }

    const { error } = await supabase
      .from('products')
      .update(parsed.data)
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    return { error: null }
  })
}

export async function archiveProduct(
  id: string
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/products')
    return { error: null }
  })
}
