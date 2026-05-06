import { createClient } from '@/lib/supabase/server'
import { ProductsTable } from '@/components/products/products-table'

const STAFF_COLUMNS = 'id, name, sku, unit, low_stock_threshold, is_active, created_at, updated_at'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }
  const isAdmin = profile?.role === 'admin'

  const { data: products, error } = isAdmin
    ? await supabase.from('products').select('*').order('name')
    : await supabase.from('products').select(STAFF_COLUMNS).order('name')

  if (error) console.error('Failed to fetch products:', error.message)

  return (
    <div className="p-8">
      <ProductsTable products={products ?? []} isAdmin={isAdmin} />
    </div>
  )
}
