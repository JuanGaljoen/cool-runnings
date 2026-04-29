-- ============================================================
-- Prevent non-admins from changing their own role.
--
-- The "Users can update their own profile" RLS policy on profiles
-- is row-level only — it allows any authenticated user to UPDATE
-- their own row, including the `role` column. Without this trigger,
-- a staff user could promote themselves to admin by calling the
-- Supabase REST API directly with the public anon key.
-- ============================================================

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Allow service-role calls (admin client) through unconditionally;
  -- application-level admin checks gate those code paths.
  if current_setting('request.jwt.claim.role', true) = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a user role';
  end if;

  return new;
end;
$$;

create trigger prevent_role_self_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_role_self_escalation();
