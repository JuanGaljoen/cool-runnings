import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export type InviteFormValues = z.infer<typeof inviteSchema>
