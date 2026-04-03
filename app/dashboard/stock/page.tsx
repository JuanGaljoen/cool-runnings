import { createClient } from '@/lib/supabase/server'
import { StockSummary } from '@/components/stock/stock-summary'
import { MovementForm } from '@/components/stock/movement-form'

export default async function StockPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, unit, low_stock_threshold, stock_levels(quantity)')
    .eq('is_active', true)
    .order('name')

  const productList = products ?? []

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
      />
    </div>
  )
}
