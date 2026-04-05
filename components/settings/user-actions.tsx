'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { updateUserName, deleteUser } from '@/app/dashboard/settings/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
})
type FormValues = z.infer<typeof schema>

interface UserActionsProps {
  userId: string
  fullName: string | null
  isSelf: boolean
}

export function UserActions({ userId, fullName, isSelf }: UserActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: fullName ?? '' },
  })

  async function onSave(values: FormValues) {
    const { error } = await updateUserName(userId, values.full_name)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Name updated')
      setEditOpen(false)
    }
  }

  async function onDelete() {
    setDeleting(true)
    const { error } = await deleteUser(userId)
    setDeleting(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('User deleted')
      setDeleteOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {/* Edit */}
      <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit user">
        <Pencil className="h-4 w-4" />
      </Button>

      {/* Delete — disabled for self */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        disabled={isSelf}
        aria-label="Delete user"
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the user and all their access. This cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete user'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
