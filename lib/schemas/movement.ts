import { z } from 'zod'

export const movementSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  movement_type: z.enum(['production', 'dispatch', 'adjustment']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.movement_type === 'dispatch' && !data.client_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A client is required for dispatches',
      path: ['client_id'],
    })
  }
})

export type MovementFormValues = z.infer<typeof movementSchema>
