import { z } from 'zod'

export const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
})

export type ClientFormValues = z.infer<typeof clientSchema>
