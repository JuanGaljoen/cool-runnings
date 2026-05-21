-- Drop the unused `sku` column from products. The client doesn't use SKUs
-- yet, so the field was just visual clutter in forms and tables.
-- The unique constraint on sku is dropped automatically when the column is.

alter table public.products drop column sku;
