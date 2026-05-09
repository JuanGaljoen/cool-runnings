-- Add 'rep' to the user_role enum, store a per-user commission rate on
-- profiles, and let clients be assigned to a rep. Reps are read-only users
-- (gated at the application layer for now); the commission rate defaults
-- to R1.00 per dispatched unit.

alter type public.user_role add value if not exists 'rep';

alter table public.profiles
  add column commission_per_unit numeric(10, 2) not null default 1.00
    check (commission_per_unit >= 0);

alter table public.clients
  add column rep_id uuid references public.profiles (id) on delete set null;

create index on public.clients (rep_id);
