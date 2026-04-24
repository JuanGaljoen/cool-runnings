import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { ZodType } from 'zod'

// ---------------------------------------------------------------------------
// Standard response shape — every server action returns this (or an extension)
// ---------------------------------------------------------------------------
export type ActionResult<T = null> = T extends null
  ? { error: string | null }
  : { error: string | null } & T

// ---------------------------------------------------------------------------
// protectedAction — requires any authenticated user
// ---------------------------------------------------------------------------
type ProtectedContext = {
  supabase: SupabaseClient<Database>
  user: User
}

export async function protectedAction<T extends { error: string | null }>(
  fn: (ctx: ProtectedContext) => Promise<T>
): Promise<T> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' } as T
  }

  return fn({ supabase, user })
}

// ---------------------------------------------------------------------------
// adminAction — requires admin role, provides admin client
// ---------------------------------------------------------------------------
type AdminContext = {
  supabase: SupabaseClient<Database>
  adminClient: SupabaseClient<Database>
  user: User
  userId: string
}

export async function adminAction<T extends { error: string | null }>(
  fn: (ctx: AdminContext) => Promise<T>
): Promise<T> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' } as T
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Forbidden' } as T
  }

  const adminClient = createAdminClient()
  return fn({ supabase, adminClient, user, userId: user.id })
}

// ---------------------------------------------------------------------------
// validate — consistent Zod safeParse with first-error extraction
// ---------------------------------------------------------------------------
type ValidateSuccess<T> = { success: true; data: T; error: null }
type ValidateFailure = { success: false; data: null; error: string }

export function validate<T>(schema: ZodType<T>, data: unknown): ValidateSuccess<T> | ValidateFailure {
  const result = schema.safeParse(data)
  if (!result.success) {
    return { success: false, data: null, error: result.error.issues[0].message }
  }
  return { success: true, data: result.data, error: null }
}
