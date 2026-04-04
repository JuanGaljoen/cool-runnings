import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_OTP_TYPES = ['invite', 'email', 'recovery', 'signup'] as const
type OtpType = (typeof VALID_OTP_TYPES)[number]

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)
  } else if (token_hash && type && (VALID_OTP_TYPES as readonly string[]).includes(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as OtpType,
    })
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)
  } else {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  return NextResponse.redirect(`${origin}/auth/set-password`)
}
