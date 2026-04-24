'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { adminAction, validate } from '@/lib/auth-helpers'
import { inviteSchema } from '@/lib/schemas/invite'
import type { Enums } from '@/types/database'

export async function inviteUser(
  values: { email: string }
): Promise<{ error: string | null }> {
  return adminAction(async ({ adminClient }) => {
    const parsed = validate(inviteSchema, values)
    if (!parsed.success) return { error: parsed.error }

    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
    const redirectTo = `${protocol}://${host}/auth/callback`

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
      parsed.data.email,
      { data: { full_name: '' }, redirectTo }
    )

    if (error) return { error: error.message }

    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert({ id: data.user.id, role: 'staff' }, { onConflict: 'id' })

    if (upsertError) return { error: upsertError.message }

    revalidatePath('/dashboard/settings')
    return { error: null }
  })
}

export async function updateUserName(
  userId: string,
  fullName: string
): Promise<{ error: string | null }> {
  return adminAction(async ({ adminClient }) => {
    const { error } = await adminClient
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { error: null }
  })
}

export async function deleteUser(
  userId: string
): Promise<{ error: string | null }> {
  return adminAction(async ({ adminClient, userId: currentUserId }) => {
    if (currentUserId === userId) return { error: 'You cannot delete your own account' }

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) return { error: error.message }

    await adminClient.from('profiles').delete().eq('id', userId)

    revalidatePath('/dashboard/settings')
    return { error: null }
  })
}

export async function updateUserRole(
  userId: string,
  role: Enums<'user_role'>
): Promise<{ error: string | null }> {
  return adminAction(async ({ adminClient }) => {
    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { error: null }
  })
}
