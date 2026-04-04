'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { inviteSchema } from '@/lib/schemas/invite'
import { headers } from 'next/headers'
import type { Enums } from '@/types/database'

export async function inviteUser(
  values: { email: string }
): Promise<{ error: string | null }> {
  const parsed = inviteSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const redirectTo = `${protocol}://${host}/auth/callback`

  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    { data: { full_name: '' }, redirectTo }
  )

  if (error) return { error: error.message }

  // Ensure profile exists with staff role (trigger may not fire for invites)
  const { error: upsertError } = await adminClient
    .from('profiles')
    .upsert({ id: data.user.id, role: 'staff' }, { onConflict: 'id' })

  if (upsertError) return { error: upsertError.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}

export async function updateUserRole(
  userId: string,
  role: Enums<'user_role'>
): Promise<{ error: string | null }> {
  // Only admins may call this — double-check server-side
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (caller?.role !== 'admin') return { error: 'Forbidden' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}
