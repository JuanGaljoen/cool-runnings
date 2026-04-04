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
import { MOVEMENT_BADGE_STYLES, MOVEMENT_LABELS } from '@/lib/movement-constants'
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
                    className={cn('border-0', MOVEMENT_BADGE_STYLES[m.movement_type])}
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
