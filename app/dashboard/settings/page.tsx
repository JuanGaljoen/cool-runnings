import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { UsersTab, type UserRow } from '@/components/settings/users-tab'
import { ExternalLink } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all auth users + profiles via admin client
  const adminClient = createAdminClient()
  const [{ data: authData }, { data: profiles }] = await Promise.all([
    adminClient.auth.admin.listUsers(),
    adminClient.from('profiles').select('id, full_name, role'),
  ])

  const users: UserRow[] = (authData?.users ?? []).map((u) => {
    const p = profiles?.find((p) => p.id === u.id)
    return {
      id: u.id,
      email: u.email ?? '',
      full_name: p?.full_name ?? null,
      role: p?.role ?? 'staff',
    }
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Admin-only settings for your workspace.
        </p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab users={users} currentUserId={user.id} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Manage your product catalogue — add, edit, or archive products.
            </p>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/dashboard/products">
                <ExternalLink className="h-4 w-4" />
                Go to Products
              </Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
