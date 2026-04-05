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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, ArchiveRestore, Archive } from 'lucide-react'
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

  function openAdd() {
    setSelectedClient(null)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setSelectedClient(client)
    setDialogOpen(true)
  }

  async function handleToggleActive(client: Client) {
    const result = await toggleClientActive(client.id, !client.is_active)
    if (result.error) toast.error(result.error)
    else toast.success(client.is_active ? 'Client archived' : 'Client restored')
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
                    <Badge variant={client.is_active ? 'default' : 'secondary'}>
                      {client.is_active ? 'Active' : 'Archived'}
                    </Badge>
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
    </>
  )
}
