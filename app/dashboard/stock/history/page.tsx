import { createClient } from '@/lib/supabase/server'
import { RecentMovementsTable } from '@/components/dashboard/recent-movements-table'
import { MovementFilters } from '@/components/stock/movement-filters'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type { Enums } from '@/types/database'

const PAGE_SIZE = 25

interface HistoryPageProps {
  searchParams: {
    page?: string
    type?: string
    product_id?: string
    client_id?: string
  }
}

export default async function MovementHistoryPage({ searchParams }: HistoryPageProps) {
  const supabase = await createClient()

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [productsResult, clientsResult] = await Promise.all([
    supabase.from('products').select('id, name').order('name'),
    supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name'),
  ])

  let query = supabase
    .from('stock_movements')
    .select(
      'id, movement_type, quantity, note, adjustment_reason, created_at, products(name), profiles(full_name), clients(company_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (searchParams.type && searchParams.type !== 'all') {
    query = query.eq('movement_type', searchParams.type as Enums<'movement_type'>)
  }
  if (searchParams.product_id && searchParams.product_id !== 'all') {
    query = query.eq('product_id', searchParams.product_id)
  }
  if (searchParams.client_id && searchParams.client_id !== 'all') {
    query = query.eq('client_id', searchParams.client_id)
  }

  const { data: movements, count } = await query

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Movement history</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {count ?? 0} movement{count !== 1 ? 's' : ''}
        </p>
      </div>

      <MovementFilters
        products={productsResult.data ?? []}
        clients={clientsResult.data ?? []}
      />

      <RecentMovementsTable movements={movements ?? []} />

      <PaginationControls page={page} totalPages={totalPages} />
    </div>
  )
}
