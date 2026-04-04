import { createClient } from '@/lib/supabase/server'
import { ProductsTable } from '@/components/products/products-table'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name')

  if (error) console.error('Failed to fetch products:', error.message)

  return (
    <div className="p-8">
      <ProductsTable products={products ?? []} />
    </div>
  )
}
