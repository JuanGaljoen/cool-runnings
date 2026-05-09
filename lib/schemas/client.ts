import { z } from 'zod'

export const clientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().refine(
    (val) => !val || /^\d{10}$/.test(val.replace(/\D/g, '')),
    'Not a valid phone number'
  ),
  rep_id: z.string().uuid().nullable().optional(),
})

export type ClientFormValues = z.infer<typeof clientSchema>
