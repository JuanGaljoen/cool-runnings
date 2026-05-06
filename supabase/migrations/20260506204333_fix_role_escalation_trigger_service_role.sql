-- Fix prevent_role_self_escalation: detect service-role calls via Supabase's
-- auth.role() helper (the canonical method) instead of reading
-- request.jwt.claim.role directly. The original GUC isn't reliably populated
-- by the admin client, which broke the inviteUser flow when the upsert
-- changes the freshly created profile's role.

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Allow service-role calls (admin client). The application layer is
  -- responsible for gating who can invoke admin-client paths.
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a user role';
  end if;

  return new;
end;
$$;
