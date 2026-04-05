'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

type Product = { id: string; name: string }
type Client = { id: string; company_name: string }

interface MovementFiltersProps {
  products: Product[]
  clients: Client[]
}

export function MovementFilters({ products, clients }: MovementFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') ?? 'all'
  const productId = searchParams.get('product_id') ?? 'all'
  const clientId = searchParams.get('client_id') ?? 'all'

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearAll() {
    router.push(pathname)
  }

  const hasFilters = type !== 'all' || productId !== 'all' || clientId !== 'all'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={type} onValueChange={(v) => update('type', v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="production">Production</SelectItem>
          <SelectItem value="dispatch">Dispatch</SelectItem>
          <SelectItem value="adjustment">Adjustment</SelectItem>
        </SelectContent>
      </Select>

      <Select value={productId} onValueChange={(v) => update('product_id', v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All products" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All products</SelectItem>
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={clientId} onValueChange={(v) => update('client_id', v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All clients</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
