import { z } from 'zod'

export const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['admin', 'staff', 'rep']),
})

export type InviteFormValues = z.infer<typeof inviteSchema>
