-- Fixes on top of 20260829190000_initial_schema.sql:
-- 1. The `profiles` table had RLS enabled but NO select/update policies at all,
--    so a logged-in user could not even read their own name/role after login.
-- 2. There was no way for a logged-out visitor to see how many teams have
--    registered for a tournament without granting broad access to the
--    `registrations` table (which would leak who registered). We expose only
--    the aggregate count via a security-definer function instead.

create policy "users view own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "admins view all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

create policy "users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

grant select on public.profiles to authenticated;

create or replace function public.tournament_team_counts()
returns table (tournament_id uuid, confirmed_teams bigint)
language sql stable security definer set search_path = public as $$
  select tournament_id, count(*) as confirmed_teams
  from public.registrations
  where status = 'confirmed'
  group by tournament_id;
$$;

grant execute on function public.tournament_team_counts() to anon, authenticated;
