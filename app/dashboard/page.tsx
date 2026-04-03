import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <form action={signOut}>
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/dashboard/products">Products</Link>
        </Button>
      </div>
    </div>
  )
}
