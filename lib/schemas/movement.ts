import { z } from 'zod'

export const movementSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  movement_type: z.enum(['production', 'dispatch', 'adjustment']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
})

export type MovementFormValues = z.infer<typeof movementSchema>
