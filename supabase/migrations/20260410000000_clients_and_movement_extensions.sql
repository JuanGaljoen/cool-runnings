-- ============================================================
-- Retroactive migration capturing schema changes that were made
-- directly via the Supabase dashboard before this repo started
-- tracking them. This file represents the live state of the DB
-- and should be marked as already-applied via:
--
--   supabase migration repair --status applied 20260410000000
--
-- Captured changes:
--   * clients table (+ RLS policies)
--   * stock_levels.stock_non_negative CHECK constraint
--   * stock_movements.client_id (uuid, nullable, FK → clients)
--   * stock_movements.adjustment_reason (text, nullable, enum-like CHECK)
-- ============================================================

-- clients ----------------------------------------------------

create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email        text,
  phone        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "Authenticated users can view clients"
  on public.clients for select
  to authenticated
  using (true);

create policy "Admins can insert clients"
  on public.clients for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update clients"
  on public.clients for update
  to authenticated
  using (public.is_admin());

-- stock_levels ----------------------------------------------

alter table public.stock_levels
  add constraint stock_non_negative check (quantity >= 0);

-- stock_movements -------------------------------------------

alter table public.stock_movements
  add column client_id uuid references public.clients (id) on delete set null;

alter table public.stock_movements
  add column adjustment_reason text;

alter table public.stock_movements
  add constraint stock_movements_adjustment_reason_check
  check (
    adjustment_reason is null or
    adjustment_reason in ('damaged', 'stocktake', 'write_off', 'theft', 'other')
  );
