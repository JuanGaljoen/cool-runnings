-- Add unit price (ZAR) to products. Stored as NUMERIC(10,2) to avoid
-- floating-point cents drift. Default 0 so existing rows are valid; admins
-- set real prices via the product form.

alter table public.products
  add column unit_price numeric(10, 2) not null default 0
    check (unit_price >= 0);
