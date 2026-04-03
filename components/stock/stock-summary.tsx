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
  stock_levels: { quantity: number } | null
}

interface StockSummaryProps {
  products: ProductWithStock[]
}

export function StockSummary({ products }: StockSummaryProps) {
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
              const quantity = product.stock_levels?.quantity ?? 0
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
