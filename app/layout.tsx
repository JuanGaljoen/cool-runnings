import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { UserProvider } from '@/components/providers/user-provider'
import type { UserProfile } from '@/components/providers/user-provider'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Cool Runnings',
  description: 'Inventory management',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: UserProfile | null = null

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    profile = data ?? null
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider profile={profile}>
          {children}
        </UserProvider>
      </body>
    </html>
  )
}
