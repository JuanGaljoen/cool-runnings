import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        fullName={profile?.full_name ?? null}
        email={user.email ?? ''}
        isAdmin={isAdmin}
      />

      {/* Offset for desktop sidebar and mobile top bar */}
      <main className="md:pl-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
