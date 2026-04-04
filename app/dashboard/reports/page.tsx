import { createClient } from '@/lib/supabase/server'
import { format, eachDayOfInterval, parseISO, subDays, startOfDay, endOfDay } from 'date-fns'
import { DateRangePicker } from '@/components/reports/date-range-picker'
import { SummaryTable, type ProductSummary } from '@/components/reports/summary-table'
import { MovementChart, type ChartDataPoint } from '@/components/reports/movement-chart'
import { ExportButton } from '@/components/reports/export-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReportsPageProps {
  searchParams: { from?: string; to?: string }
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const today = new Date()
  const toDate = searchParams.to ? parseISO(searchParams.to) : today
  const fromDate = searchParams.from ? parseISO(searchParams.from) : subDays(today, 29)

  const fromStr = format(fromDate, 'yyyy-MM-dd')
  const toStr = format(toDate, 'yyyy-MM-dd')

  const supabase = await createClient()

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, movement_type, quantity, created_at, products(id, name)')
    .gte('created_at', startOfDay(fromDate).toISOString())
    .lte('created_at', endOfDay(toDate).toISOString())
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
    const dayMovements = list.filter(
      (m) => format(new Date(m.created_at), 'yyyy-MM-dd') === dateStr
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
