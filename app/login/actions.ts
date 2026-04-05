'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function sendPasswordReset(
  _prevState: { error: string | null; sent: boolean },
  formData: FormData
): Promise<{ error: string | null; sent: boolean }> {
  const email = formData.get('email') as string
  const supabase = await createClient()

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http')
  const redirectTo = `${protocol}://${host}/auth/callback?mode=reset`

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return { error: error.message, sent: false }

  return { error: null, sent: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
