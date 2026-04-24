'use server'

import { revalidatePath } from 'next/cache'
import { protectedAction, validate } from '@/lib/auth-helpers'
import { clientSchema, type ClientFormValues } from '@/lib/schemas/client'

export type { ClientFormValues }

export async function createClientAction(
  values: ClientFormValues
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const parsed = validate(clientSchema, values)
    if (!parsed.success) return { error: parsed.error }

    const { error } = await supabase.from('clients').insert({
      company_name: parsed.data.company_name,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/clients')
    return { error: null }
  })
}

export async function updateClientAction(
  id: string,
  values: ClientFormValues
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const parsed = validate(clientSchema, values)
    if (!parsed.success) return { error: parsed.error }

    const { error } = await supabase
      .from('clients')
      .update({
        company_name: parsed.data.company_name,
        contact_name: parsed.data.contact_name || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/clients')
    return { error: null }
  })
}

export async function toggleClientActive(
  id: string,
  is_active: boolean
): Promise<{ error: string | null }> {
  return protectedAction(async ({ supabase }) => {
    const { error } = await supabase
      .from('clients')
      .update({ is_active })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/clients')
    return { error: null }
  })
}
