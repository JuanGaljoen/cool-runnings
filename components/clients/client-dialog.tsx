'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClientAction, updateClientAction } from '@/app/dashboard/clients/actions'
import { clientSchema, type ClientFormValues } from '@/lib/schemas/client'
import type { Tables } from '@/types/database'

type Client = Tables<'clients'>
type Rep = { id: string; full_name: string | null }

const NO_REP = '__none__'

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  reps: Rep[]
}

export function ClientDialog({ open, onOpenChange, client, reps }: ClientDialogProps) {
  const isEdit = !!client

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { company_name: '', contact_name: '', email: '', phone: '', rep_id: null },
  })

  useEffect(() => {
    if (client) {
      form.reset({
        company_name: client.company_name,
        contact_name: client.contact_name ?? '',
        email: client.email ?? '',
        phone: client.phone ?? '',
        rep_id: client.rep_id ?? null,
      })
    } else {
      form.reset({ company_name: '', contact_name: '', email: '', phone: '', rep_id: null })
    }
  }, [client, form])

  async function onSubmit(values: ClientFormValues) {
    const result = isEdit
      ? await updateClientAction(client.id, values)
      : await createClientAction(values)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? 'Client updated' : 'Client added')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit client' : 'Add client'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Ice Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact name <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="+27 82 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rep_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sales rep <span className="text-muted-foreground">(optional)</span></FormLabel>
                  <Select
                    value={field.value ?? NO_REP}
                    onValueChange={(v) => field.onChange(v === NO_REP ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_REP}>Unassigned</SelectItem>
                      {reps.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.full_name ?? r.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
