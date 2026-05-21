import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ClientDispatch = {
  client_name: string
  dispatched: number
}

export function TodaysClientDispatches({ rows }: { rows: ClientDispatch[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Units dispatched</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground py-10">
                No dispatches recorded in the last 7 days.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.client_name}>
                <TableCell className="font-medium">{row.client_name}</TableCell>
                <TableCell className="tabular-nums">{row.dispatched}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
