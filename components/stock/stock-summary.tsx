import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ProductWithStock = {
  id: string
  name: string
  sku: string
  unit: string
  low_stock_threshold: number
  stock_levels: { quantity: number } | { quantity: number }[] | null
}

interface StockSummaryProps {
  products: ProductWithStock[]
  compact?: boolean
}

function getQuantity(sl: ProductWithStock['stock_levels']) {
  return Array.isArray(sl) ? sl[0]?.quantity ?? 0 : sl?.quantity ?? 0
}

export function StockSummary({ products, compact = false }: StockSummaryProps) {
  if (compact) {
    if (products.length === 0) {
      return (
        <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground">
          No active products found.
        </div>
      )
    }

    return (
      <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const quantity = getQuantity(product.stock_levels)
          const isOut = quantity === 0
          const isLow = !isOut && quantity < product.low_stock_threshold

          return (
            <div
              key={product.id}
              className={cn(
                'rounded-md border p-4',
                isOut && 'border-destructive/30 bg-destructive/5',
                isLow && 'border-amber-300 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {product.name}
                </p>
                {isOut && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                    Out of stock
                  </span>
                )}
                {isLow && (
                  <span className="inline-flex shrink-0 items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    Low stock
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'mt-2 text-3xl font-bold tabular-nums',
                  isOut && 'text-destructive'
                )}
              >
                {quantity.toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Low stock threshold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                No active products found.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const quantity = getQuantity(product.stock_levels)
              const isLow = quantity < product.low_stock_threshold

              return (
                <TableRow
                  key={product.id}
                  className={cn(isLow && 'bg-amber-50 dark:bg-amber-950/20')}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {product.name}
                      {isLow && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Low stock
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell className="text-right">{quantity}</TableCell>
                  <TableCell className="text-right">{product.low_stock_threshold}</TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
