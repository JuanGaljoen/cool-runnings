import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Enums } from '@/types/database'

type MovementType = Enums<'movement_type'>

type Movement = {
  id: string
  movement_type: MovementType
  quantity: number
  note: string | null
  created_at: string
  products: { name: string } | null
  profiles: { full_name: string | null } | null
}

const BADGE_STYLES: Record<MovementType, string> = {
  production: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  dispatch: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  adjustment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const MOVEMENT_LABELS: Record<MovementType, string> = {
  production: 'Production',
  dispatch: 'Dispatch',
  adjustment: 'Adjustment',
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

interface RecentMovementsTableProps {
  movements: Movement[]
}

export function RecentMovementsTable({ movements }: RecentMovementsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Recorded by</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                No movements recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.products?.name ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('border-0', BADGE_STYLES[m.movement_type])}
                  >
                    {MOVEMENT_LABELS[m.movement_type]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{m.quantity}</TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                  {m.note ?? '—'}
                </TableCell>
                <TableCell>{m.profiles?.full_name ?? 'Unknown'}</TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatDateTime(m.created_at)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
