'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { productSchema, type ProductFormValues } from '@/lib/schemas/product'

export async function createProduct(
  values: ProductFormValues
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const parsed = productSchema.parse(values)

  const { error } = await supabase.from('products').insert(parsed)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  return { error: null }
}

export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const parsed = productSchema.parse(values)

  const { error } = await supabase
    .from('products')
    .update(parsed)
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  return { error: null }
}

export async function archiveProduct(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/products')
  return { error: null }
}
