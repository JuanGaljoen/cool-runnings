'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { clientSchema, type ClientFormValues } from '@/lib/schemas/client'

export type { ClientFormValues }

export async function createClientAction(
  values: ClientFormValues
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const parsed = clientSchema.parse(values)

  const { error } = await supabase.from('clients').insert({
    company_name: parsed.company_name,
    contact_name: parsed.contact_name || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clients')
  return { error: null }
}

export async function updateClientAction(
  id: string,
  values: ClientFormValues
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const parsed = clientSchema.parse(values)

  const { error } = await supabase
    .from('clients')
    .update({
      company_name: parsed.company_name,
      contact_name: parsed.contact_name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clients')
  return { error: null }
}

export async function toggleClientActive(
  id: string,
  is_active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ is_active })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/clients')
  return { error: null }
}
