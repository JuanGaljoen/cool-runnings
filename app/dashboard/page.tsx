import Link from 'next/link'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/stat-card'
import { RecentMovementsTable } from '@/components/dashboard/recent-movements-table'
import { TodaysClientDispatches } from '@/components/dashboard/todays-client-dispatches'
import { QuickRecordSheet } from '@/components/dashboard/quick-record-sheet'
import { StockSummary } from '@/components/stock/stock-summary'
import { MovementChart, type ChartDataPoint } from '@/components/reports/movement-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const sevenDaysAgo = subDays(now, 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    productsResult,
    movementsTodayResult,
    recentMovementsResult,
    chartMovementsResult,
    todayDispatchesResult,
    clientsResult,
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, unit, low_stock_threshold, stock_levels(quantity)')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('stock_movements')
      .select('movement_type, quantity')
      .gte('created_at', startOfToday.toISOString()),

    supabase
      .from('stock_movements')
      .select(
        'id, movement_type, quantity, note, adjustment_reason, created_at, products(name), profiles(full_name), clients(company_name)'
      )
      .order('created_at', { ascending: false })
      .limit(10),

    supabase
      .from('stock_movements')
      .select('movement_type, quantity, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at'),

    supabase
      .from('stock_movements')
      .select('quantity, clients(company_name)')
      .eq('movement_type', 'dispatch')
      .gte('created_at', startOfToday.toISOString()),

    supabase
      .from('clients')
      .select('id, company_name')
      .eq('is_active', true)
      .order('company_name'),
  ])

  const products = productsResult.data ?? []
  const todayMovements = movementsTodayResult.data ?? []
  const recentMovements = recentMovementsResult.data ?? []
  const chartMovements = chartMovementsResult.data ?? []
  const todayDispatches = todayDispatchesResult.data ?? []
  const clients = clientsResult.data ?? []

  // Stat cards
  const totalStock = products.reduce(
    (sum, p) => sum + (p.stock_levels?.quantity ?? 0),
    0
  )
  const lowStockCount = products.filter(
    (p) => (p.stock_levels?.quantity ?? 0) < p.low_stock_threshold
  ).length
  const producedToday = todayMovements
    .filter((m) => m.movement_type === 'production')
    .reduce((sum, m) => sum + m.quantity, 0)
  const dispatchedToday = todayMovements
    .filter((m) => m.movement_type === 'dispatch')
    .reduce((sum, m) => sum + m.quantity, 0)

  // 7-day chart data
  const days = eachDayOfInterval({ start: sevenDaysAgo, end: now })
  const chartData: ChartDataPoint[] = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayMovements = chartMovements.filter(
      (m) => m.created_at.slice(0, 10) === dateStr
    )
    return {
      date: format(day, 'MMM d'),
      production: dayMovements
        .filter((m) => m.movement_type === 'production')
        .reduce((s, m) => s + m.quantity, 0),
      dispatch: dayMovements
        .filter((m) => m.movement_type === 'dispatch')
        .reduce((s, m) => s + m.quantity, 0),
    }
  })

  // Today's dispatches by client
  const clientMap = new Map<string, number>()
  for (const m of todayDispatches) {
    const name = (m.clients as { company_name: string } | null)?.company_name
    if (!name) continue
    clientMap.set(name, (clientMap.get(name) ?? 0) + m.quantity)
  }
  const clientDispatchRows = Array.from(clientMap.entries())
    .map(([client_name, dispatched]) => ({ client_name, dispatched }))
    .sort((a, b) => b.dispatched - a.dispatched)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your inventory.
          </p>
        </div>
        <QuickRecordSheet
          products={products.map((p) => ({ id: p.id, name: p.name }))}
          clients={clients}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          title="Produced today"
          value={producedToday.toLocaleString()}
          description="Units recorded since midnight"
        />
        <StatCard
          title="Dispatched today"
          value={dispatchedToday.toLocaleString()}
          description="Units dispatched since midnight"
        />
      </div>

      {/* Stock levels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current stock levels</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <StockSummary products={products} />
        </CardContent>
      </Card>

      {/* 7-day chart + today's dispatches by client */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Production vs dispatch — last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <MovementChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s dispatches by client</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <TodaysClientDispatches rows={clientDispatchRows} />
          </CardContent>
        </Card>
      </div>

      {/* Recent movements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent movements</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/stock/history">View all</Link>
          </Button>
        </div>
        <RecentMovementsTable movements={recentMovements} compact />
      </div>
    </div>
  )
}
