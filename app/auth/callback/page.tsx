'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const searchParams = new URLSearchParams(window.location.search)
    const mode = searchParams.get('mode')
    const setPasswordPath = mode === 'reset' ? '/auth/set-password?mode=reset' : '/auth/set-password'

    // Hash-based tokens (implicit flow — Supabase invite links)
    const hash = window.location.hash
    if (hash) {
      const params = new URLSearchParams(hash.substring(1))
      const error = params.get('error')

      if (error) {
        router.replace('/login?error=auth')
        return
      }

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        supabase.auth
          .setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => {
            router.replace(error ? '/login?error=auth' : setPasswordPath)
          })
        return
      }
    }

    // Code-based tokens (PKCE flow)
    // Note: createBrowserClient auto-exchanges PKCE codes (detectSessionInUrl: true),
    // so the code may already be consumed by the time this runs. If exchange fails,
    // fall back to checking whether a session was established automatically.
    const code = searchParams.get('code')
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (!error) {
            router.replace(setPasswordPath)
            return
          }
          // Code was already consumed by auto-detection — check for existing session
          supabase.auth.getSession().then(({ data: { session } }) => {
            router.replace(session ? setPasswordPath : '/login?error=auth')
          })
        })
      return
    }

    // token_hash flow (newer Supabase email links)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    if (token_hash && type) {
      supabase.auth
        .verifyOtp({ token_hash, type: type as 'invite' | 'email' | 'recovery' | 'signup' })
        .then(({ error }) => {
          router.replace(error ? '/login?error=auth' : setPasswordPath)
        })
      return
    }

    router.replace('/login?error=auth')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground text-sm">Verifying your link…</p>
    </div>
  )
}
