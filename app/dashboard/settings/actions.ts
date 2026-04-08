'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { inviteSchema } from '@/lib/schemas/invite'
import { requireAdmin } from '@/lib/auth-helpers'
import { headers } from 'next/headers'
import type { Enums } from '@/types/database'

export async function inviteUser(
  values: { email: string }
): Promise<{ error: string | null }> {
  const parsed = inviteSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

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

export async function updateUserName(
  userId: string,
  fullName: string
): Promise<{ error: string | null }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}

export async function deleteUser(
  userId: string
): Promise<{ error: string | null }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth
  if (auth.userId === userId) return { error: 'You cannot delete your own account' }

  const adminClient = createAdminClient()

  await adminClient.from('profiles').delete().eq('id', userId)

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}

export async function updateUserRole(
  userId: string,
  role: Enums<'user_role'>
): Promise<{ error: string | null }> {
  const auth = await requireAdmin()
  if ('error' in auth) return auth

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { error: null }
}
