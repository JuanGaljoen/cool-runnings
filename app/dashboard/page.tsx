import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentMovementsTable } from '@/components/dashboard/recent-movements-table'

export default async function DashboardPage() {
  const supabase = await createClient()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [productsResult, movementsTodayResult, recentMovementsResult] =
    await Promise.all([
      supabase
        .from('products')
        .select('id, low_stock_threshold, stock_levels(quantity)')
        .eq('is_active', true),

      supabase
        .from('stock_movements')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfToday.toISOString()),

      supabase
        .from('stock_movements')
        .select(
          'id, movement_type, quantity, note, created_at, products(name), profiles(full_name)'
        )
        .order('created_at', { ascending: false })
        .limit(10),
    ])

  const products = productsResult.data ?? []
  const totalProducts = products.length
  const totalStock = products.reduce(
    (sum, p) => sum + (p.stock_levels?.quantity ?? 0),
    0
  )
  const lowStockCount = products.filter(
    (p) => (p.stock_levels?.quantity ?? 0) < p.low_stock_threshold
  ).length
  const movementsToday = movementsTodayResult.count ?? 0
  const recentMovements = recentMovementsResult.data ?? []

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your inventory.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total products"
          value={totalProducts}
          description="Active products"
        />
        <StatCard
          title="Total stock units"
          value={totalStock.toLocaleString()}
          description="Across all active products"
        />
        <StatCard
          title="Low stock"
          value={lowStockCount}
          description="Products below threshold"
          alert={lowStockCount > 0}
        />
        <StatCard
          title="Movements today"
          value={movementsToday}
          description="Recorded since midnight"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent movements</h2>
        <RecentMovementsTable movements={recentMovements} />
      </div>
    </div>
  )
}
