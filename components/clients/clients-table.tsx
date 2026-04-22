'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Plus, Pencil, ArchiveRestore, Archive } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { ClientDialog } from './client-dialog'
import { toggleClientActive } from '@/app/dashboard/clients/actions'
import { useUser } from '@/components/providers/user-provider'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'>

export function ClientsTable({ clients }: { clients: Client[] }) {
  const { profile } = useUser()
  const isAdmin = profile?.role === 'admin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [archiveClient, setArchiveClient] = useState<Client | null>(null)
  const [archiving, setArchiving] = useState(false)

  function openAdd() {
    setSelectedClient(null)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  async function handleToggleActive(client: Client) {
    if (client.is_active) {
      setArchiveClient(client)
      return
    }
    const result = await toggleClientActive(client.id, true)
    if (result.error) toast.error(result.error)
    else toast.success('Client restored')
  }

  async function confirmArchive() {
    if (!archiveClient) return
    setArchiving(true)
    const result = await toggleClientActive(archiveClient.id, false)
    setArchiving(false)
    if (result.error) toast.error(result.error)
    else toast.success('Client archived')
    setArchiveClient(null)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add client
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-[100px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-10">
                  No clients yet.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.company_name}</TableCell>
                  <TableCell>{client.contact_name ?? '—'}</TableCell>
                  <TableCell>{client.email ?? '—'}</TableCell>
                  <TableCell>{client.phone ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge isActive={client.is_active} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(client)}
                          aria-label="Edit client"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(client)}
                          aria-label={client.is_active ? 'Archive client' : 'Restore client'}
                        >
                          {client.is_active
                            ? <Archive className="h-4 w-4" />
                            : <ArchiveRestore className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isAdmin && (
        <ClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={selectedClient}
        />
      )}

      <Dialog open={!!archiveClient} onOpenChange={(open) => { if (!open) setArchiveClient(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive client</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to archive <span className="font-medium text-foreground">{archiveClient?.company_name}</span>? They will no longer appear in dispatch forms.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmArchive} disabled={archiving}>
              {archiving ? 'Archiving…' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
