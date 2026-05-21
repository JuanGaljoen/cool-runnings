import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.string().min(1, 'Unit is required'),
  low_stock_threshold: z.number().int().min(0, 'Must be 0 or more'),
  is_active: z.boolean(),
  unit_price: z.number().min(0, 'Price must be 0 or more'),
})

export type ProductFormValues = z.infer<typeof productSchema>
