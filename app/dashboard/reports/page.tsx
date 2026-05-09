import { createClient } from '@/lib/supabase/server'
import { format, eachDayOfInterval, subDays } from 'date-fns'
import { DateRangePicker } from '@/components/reports/date-range-picker'
import { SummaryTable, type ProductSummary } from '@/components/reports/summary-table'
import { MovementChart, type ChartDataPoint } from '@/components/reports/movement-chart'
import { ClientDispatchTable, type ClientDispatchRow } from '@/components/reports/client-dispatch-table'
import { ExportButton } from '@/components/reports/export-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatZAR } from '@/lib/utils'

interface RevenueByProduct {
  product_id: string
  product_name: string
  dispatched: number
  revenue: number
}

interface RevenueByClient {
  client_id: string
  client_name: string
  dispatched: number
  revenue: number
}

interface CommissionByRep {
  rep_id: string
  rep_name: string
  bags: number
  commission: number
}

interface ReportsPageProps {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function ReportsPage({ searchParams: searchParamsPromise }: ReportsPageProps) {
  const searchParams = await searchParamsPromise
  const DEFAULT_RANGE_DAYS = 30
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const defaultFrom = format(subDays(new Date(), DEFAULT_RANGE_DAYS - 1), 'yyyy-MM-dd')
  const rawFrom = new Date(`${searchParams.from ?? defaultFrom}T12:00:00.000Z`)
  const rawTo = new Date(`${searchParams.to ?? todayStr}T12:00:00.000Z`)
  const fromStr = isNaN(rawFrom.getTime()) ? defaultFrom : (searchParams.from ?? defaultFrom)
  const toStr = isNaN(rawTo.getTime()) ? todayStr : (searchParams.to ?? todayStr)

  // Use noon UTC to safely represent each date regardless of server timezone
  const fromDate = isNaN(rawFrom.getTime()) ? new Date(`${defaultFrom}T12:00:00.000Z`) : rawFrom
  const toDate = isNaN(rawTo.getTime()) ? new Date(`${todayStr}T12:00:00.000Z`) : rawTo

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const isAdmin = profile?.role === 'admin'

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('id, movement_type, quantity, created_at, products(id, name), clients(id, company_name)')
    .gte('created_at', `${fromStr}T00:00:00.000Z`)
    .lte('created_at', `${toStr}T23:59:59.999Z`)
    .order('created_at')

  const list = movements ?? []

  // Admin-only: compute revenue from dispatches × current product unit_price
  let revenueByProduct: RevenueByProduct[] = []
  let revenueByClient: RevenueByClient[] = []
  let revenueTotal = 0
  if (isAdmin) {
    const { data: priced } = await supabase
      .from('stock_movements')
      .select('quantity, products(id, name, unit_price), clients(id, company_name)')
      .eq('movement_type', 'dispatch')
      .gte('created_at', `${fromStr}T00:00:00.000Z`)
      .lte('created_at', `${toStr}T23:59:59.999Z`)

    const productAcc = new Map<string, RevenueByProduct>()
    const clientAcc = new Map<string, RevenueByClient>()

    for (const d of priced ?? []) {
      const product = d.products as { id: string; name: string; unit_price: number } | null
      if (!product) continue
      const revenue = d.quantity * Number(product.unit_price)
      revenueTotal += revenue

      const pRow = productAcc.get(product.id) ?? {
        product_id: product.id,
        product_name: product.name,
        dispatched: 0,
        revenue: 0,
      }
      pRow.dispatched += d.quantity
      pRow.revenue += revenue
      productAcc.set(product.id, pRow)

      const client = d.clients as { id: string; company_name: string } | null
      if (client) {
        const cRow = clientAcc.get(client.id) ?? {
          client_id: client.id,
          client_name: client.company_name,
          dispatched: 0,
          revenue: 0,
        }
        cRow.dispatched += d.quantity
        cRow.revenue += revenue
        clientAcc.set(client.id, cRow)
      }
    }

    revenueByProduct = Array.from(productAcc.values()).sort((a, b) => b.revenue - a.revenue)
    revenueByClient = Array.from(clientAcc.values()).sort((a, b) => b.revenue - a.revenue)
  }

  // Admin-only: commission by rep
  const commissionByRep: CommissionByRep[] = []
  let commissionTotal = 0
  if (isAdmin) {
    const { data: repDispatches } = await supabase
      .from('stock_movements')
      .select('quantity, clients!inner(rep_id)')
      .eq('movement_type', 'dispatch')
      .gte('created_at', `${fromStr}T00:00:00.000Z`)
      .lte('created_at', `${toStr}T23:59:59.999Z`)
      .not('clients.rep_id', 'is', null)

    const bagsByRep = new Map<string, number>()
    for (const d of repDispatches ?? []) {
      const c = d.clients as { rep_id: string | null } | null
      if (!c?.rep_id) continue
      bagsByRep.set(c.rep_id, (bagsByRep.get(c.rep_id) ?? 0) + d.quantity)
    }

    const repIds = Array.from(bagsByRep.keys())
    if (repIds.length > 0) {
      const { data: repProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, commission_per_unit')
        .in('id', repIds)

      for (const rp of repProfiles ?? []) {
        const bags = bagsByRep.get(rp.id) ?? 0
        const commission = bags * Number(rp.commission_per_unit)
        commissionTotal += commission
        commissionByRep.push({
          rep_id: rp.id,
          rep_name: rp.full_name ?? '—',
          bags,
          commission,
        })
      }
      commissionByRep.sort((a, b) => b.commission - a.commission)
    }
  }

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

  // Aggregate dispatches by client
  const clientMap = new Map<string, ClientDispatchRow>()
  for (const m of list) {
    if (m.movement_type !== 'dispatch') continue
    const client = m.clients as { id: string; company_name: string } | null
    if (!client) continue
    if (!clientMap.has(client.id)) {
      clientMap.set(client.id, {
        client_id: client.id,
        client_name: client.company_name,
        dispatched: 0,
      })
    }
    clientMap.get(client.id)!.dispatched += m.quantity
  }
  const clientDispatchRows = Array.from(clientMap.values()).sort(
    (a, b) => b.dispatched - a.dispatched
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
          <CardTitle className="text-base">Dispatches by client</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <ClientDispatchTable rows={clientDispatchRows} />
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

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Revenue summary
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Total: {formatZAR(revenueTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            <div>
              <h3 className="text-sm font-medium mb-2">By product</h3>
              {revenueByProduct.length === 0 ? (
                <p className="text-sm text-muted-foreground">No dispatches in selected period.</p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Product</th>
                        <th className="text-right px-3 py-2 font-medium">Dispatched</th>
                        <th className="text-right px-3 py-2 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByProduct.map((r) => (
                        <tr key={r.product_id} className="border-t">
                          <td className="px-3 py-2">{r.product_name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.dispatched}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatZAR(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">By client</h3>
              {revenueByClient.length === 0 ? (
                <p className="text-sm text-muted-foreground">No client dispatches in selected period.</p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Client</th>
                        <th className="text-right px-3 py-2 font-medium">Dispatched</th>
                        <th className="text-right px-3 py-2 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByClient.map((r) => (
                        <tr key={r.client_id} className="border-t">
                          <td className="px-3 py-2">{r.client_name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.dispatched}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatZAR(r.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Commission summary
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                Total: {formatZAR(commissionTotal)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {commissionByRep.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dispatches with assigned reps in selected period.</p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Rep</th>
                      <th className="text-right px-3 py-2 font-medium">Bags sold</th>
                      <th className="text-right px-3 py-2 font-medium">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionByRep.map((r) => (
                      <tr key={r.rep_id} className="border-t">
                        <td className="px-3 py-2">{r.rep_name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.bags}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatZAR(r.commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
