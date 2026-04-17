import { z } from 'zod'

export const ADJUSTMENT_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'stocktake', label: 'Stocktake correction' },
  { value: 'write_off', label: 'Write-off' },
  { value: 'theft', label: 'Theft' },
  { value: 'other', label: 'Other' },
] as const

export type AdjustmentReason = typeof ADJUSTMENT_REASONS[number]['value']

export const movementSchema = z.object({
  product_id: z.string().uuid('Please select a product'),
  movement_type: z.enum(['production', 'dispatch', 'adjustment']),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  note: z.string().optional(),
  client_id: z.string().uuid().optional().nullable(),
  adjustment_reason: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.movement_type === 'dispatch' && !data.client_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A client is required for dispatches',
      path: ['client_id'],
    })
  }
  if (data.movement_type === 'adjustment' && !data.adjustment_reason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A reason is required for adjustments',
      path: ['adjustment_reason'],
    })
  }
})

export type MovementFormValues = z.infer<typeof movementSchema>
