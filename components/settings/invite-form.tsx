'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { inviteSchema, type InviteFormValues } from '@/lib/schemas/invite'
import { inviteUser } from '@/app/dashboard/settings/actions'

export function InviteForm() {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: InviteFormValues) {
    const { error } = await inviteUser(values)

    if (error) {
      toast.error(error)
      return
    }

    toast.success(`Invite sent to ${values.email}`)
    form.reset()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-3">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Invite new staff member</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Sending…' : 'Send invite'}
        </Button>
      </form>
    </Form>
  )
}
