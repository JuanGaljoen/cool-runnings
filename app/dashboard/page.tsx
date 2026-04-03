import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'

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
    </div>
  )
}
