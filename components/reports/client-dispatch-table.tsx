import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type ClientDispatchRow = {
  client_id: string | null
  client_name: string
  dispatched: number
}

export function ClientDispatchTable({ rows }: { rows: ClientDispatchRow[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Units dispatched</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                No dispatches in this period.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.client_id ?? 'unassigned'}>
                <TableCell className="font-medium">{row.client_name}</TableCell>
                <TableCell className="text-right text-blue-700 dark:text-blue-400">
                  {row.dispatched}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
