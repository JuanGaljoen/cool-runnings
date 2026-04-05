import { createClient } from '@/lib/supabase/server'
import { StockSummary } from '@/components/stock/stock-summary'
import { MovementForm } from '@/components/stock/movement-form'

export default async function StockPage() {
  const supabase = await createClient()

  const [productsResult, clientsResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, unit, low_stock_threshold, stock_levels(quantity)')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('clients')
      .select('id, company_name')
      .eq('is_active', true)
      .order('company_name'),
  ])

  if (productsResult.error) console.error('Failed to fetch products:', productsResult.error.message)

  const productList = productsResult.data ?? []
  const clientList = clientsResult.data ?? []

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Current stock levels across all active products.
        </p>
      </div>

      <StockSummary products={productList} />

      <MovementForm
        products={productList.map((p) => ({ id: p.id, name: p.name }))}
        clients={clientList}
      />
    </div>
  )
}
