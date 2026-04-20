import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export type ProductSummary = {
  product_id: string
  product_name: string
  produced: number
  dispatched: number
  adjusted: number
  net_change: number
}

export function SummaryTable({ rows }: { rows: ProductSummary[] }) {
  const totals = rows.reduce(
    (acc, r) => ({
      produced: acc.produced + r.produced,
      dispatched: acc.dispatched + r.dispatched,
      adjusted: acc.adjusted + r.adjusted,
      net_change: acc.net_change + r.net_change,
    }),
    { produced: 0, dispatched: 0, adjusted: 0, net_change: 0 }
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Produced</TableHead>
            <TableHead className="text-right">Dispatched</TableHead>
            <TableHead className="text-right">Adjusted</TableHead>
            <TableHead className="text-right">Net change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                No movements in this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.product_id}>
                <TableCell className="font-medium">{row.product_name}</TableCell>
                <TableCell className="text-right text-green-700 dark:text-green-400">
                  +{row.produced}
                </TableCell>
                <TableCell className="text-right text-blue-700 dark:text-blue-400">
                  -{row.dispatched}
                </TableCell>
                <TableCell className="text-right text-amber-700 dark:text-amber-400">
                  -{row.adjusted}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-semibold',
                    row.net_change >= 0
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-destructive'
                  )}
                >
                  {row.net_change >= 0 ? '+' : ''}{row.net_change}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {rows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">
                +{totals.produced}
              </TableCell>
              <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">
                -{totals.dispatched}
              </TableCell>
              <TableCell className="text-right font-semibold text-amber-700 dark:text-amber-400">
                -{totals.adjusted}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  totals.net_change >= 0
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-destructive'
                )}
              >
                {totals.net_change >= 0 ? '+' : ''}{totals.net_change}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
