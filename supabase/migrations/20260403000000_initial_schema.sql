-- ============================================================
-- Enums
-- ============================================================

create type public.user_role as enum ('admin', 'staff');
create type public.movement_type as enum ('production', 'dispatch', 'adjustment');

-- ============================================================
-- Tables
-- ============================================================

-- profiles: extends auth.users
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        public.user_role not null default 'staff',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- products
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  sku                 text not null unique,
  unit                text not null,
  low_stock_threshold int not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- stock_levels: one row per product, maintained by trigger
create table public.stock_levels (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null unique references public.products (id) on delete cascade,
  quantity    int not null default 0,
  updated_at  timestamptz not null default now()
);

-- stock_movements: append-only ledger
create table public.stock_movements (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete restrict,
  created_by    uuid not null references public.profiles (id) on delete restrict,
  movement_type public.movement_type not null,
  quantity      int not null check (quantity > 0),
  note          text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index on public.stock_movements (product_id);
create index on public.stock_movements (created_by);
create index on public.stock_movements (created_at desc);

-- ============================================================
-- Helper: auto-create profile on sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Helper: check if the calling user is an admin
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Trigger: keep stock_levels in sync with stock_movements
-- ============================================================

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.stock_levels (product_id, quantity, updated_at)
  values (new.product_id, 0, now())
  on conflict (product_id) do nothing;

  if new.movement_type = 'production' then
    update public.stock_levels
    set quantity   = quantity + new.quantity,
        updated_at = now()
    where product_id = new.product_id;
  else
    -- dispatch and adjustment both subtract
    update public.stock_levels
    set quantity   = quantity - new.quantity,
        updated_at = now()
    where product_id = new.product_id;
  end if;

  return new;
end;
$$;

create trigger on_stock_movement_inserted
  after insert on public.stock_movements
  for each row execute procedure public.apply_stock_movement();

-- ============================================================
-- updated_at helpers
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.stock_levels   enable row level security;
alter table public.stock_movements enable row level security;

-- profiles --
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- products --
create policy "Authenticated users can read products"
  on public.products for select
  to authenticated
  using (true);

create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update products"
  on public.products for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using (public.is_admin());

-- stock_levels --
create policy "Authenticated users can read stock levels"
  on public.stock_levels for select
  to authenticated
  using (true);

-- stock_movements --
create policy "Authenticated users can read stock movements"
  on public.stock_movements for select
  to authenticated
  using (true);

create policy "Authenticated users can insert stock movements"
  on public.stock_movements for insert
  to authenticated
  with check (created_by = auth.uid());
