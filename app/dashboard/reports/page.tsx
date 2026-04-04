import { createClient } from '@/lib/supabase/server'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { DateRangePicker } from '@/components/reports/date-range-picker'
import { SummaryTable, type ProductSummary } from '@/components/reports/summary-table'
import { MovementChart, type ChartDataPoint } from '@/components/reports/movement-chart'
import { ExportButton } from '@/components/reports/export-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportsPageProps {
  searchParams: { from?: string; to?: string }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const fromStr = searchParams.from ?? format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const toStr = searchParams.to ?? todayStr

  // Use noon UTC to safely represent each date regardless of server timezone
  const fromDate = new Date(`${fromStr}T12:00:00.000Z`)
  const toDate = new Date(`${toStr}T12:00:00.000Z`)

  const supabase = await createClient()

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, movement_type, quantity, created_at, products(id, name)')
    .gte('created_at', `${fromStr}T00:00:00.000Z`)
    .lte('created_at', `${toStr}T23:59:59.999Z`)
    .order('created_at')

  const list = movements ?? []

  // Aggregate by product
  const productMap = new Map<string, ProductSummary>()
  for (const m of list) {
    const product = m.products as { id: string; name: string } | null
    if (!product) continue
    if (!productMap.has(product.id)) {
      productMap.set(product.id, {
        product_id: product.id,
        product_name: product.name,
        produced: 0,
        dispatched: 0,
        adjusted: 0,
        net_change: 0,
      })
    }
    const row = productMap.get(product.id)!
    if (m.movement_type === 'production') row.produced += m.quantity
    if (m.movement_type === 'dispatch') row.dispatched += m.quantity
    if (m.movement_type === 'adjustment') row.adjusted += m.quantity
    row.net_change = row.produced - row.dispatched - row.adjusted
  }
  const summaryRows = Array.from(productMap.values()).sort((a, b) =>
    a.product_name.localeCompare(b.product_name)
  )

  // Aggregate by day for chart
  const days = eachDayOfInterval({ start: fromDate, end: toDate })
  const chartData: ChartDataPoint[] = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayMovements = list.filter((m) => m.created_at.slice(0, 10) === dateStr)
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

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {list.length} movement{list.length !== 1 ? 's' : ''} in selected period
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker from={fromDate} to={toDate} />
          <ExportButton from={fromStr} to={toStr} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <SummaryTable rows={summaryRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily production vs dispatch</CardTitle>
        </CardHeader>
        <CardContent>
          <MovementChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
