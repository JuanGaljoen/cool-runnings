import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  unit: z.string().min(1, 'Unit is required'),
  low_stock_threshold: z.coerce.number().int().min(0, 'Must be 0 or more'),
  is_active: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>
