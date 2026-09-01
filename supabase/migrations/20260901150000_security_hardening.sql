-- Campus Clash security hardening.
-- Run after the existing migrations.

-- Protect role/verification fields even if a client sends a crafted UPDATE.
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.verified is distinct from old.verified)
     and not public.is_admin() then
    raise exception 'Only an admin can change role or verification status.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_self_role_escalation on public.profiles;
create trigger profiles_prevent_self_role_escalation
before update on public.profiles
for each row execute function public.prevent_self_role_escalation();

-- Database-side registration integrity. Never trust the browser to decide
-- whether a registration is paid/confirmed, open, within capacity, or valid.
create or replace function public.enforce_registration_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_captain uuid;
  v_entry_fee numeric(10,2);
  v_status text;
  v_deadline date;
  v_tournament_status text;
  v_max_teams integer;
  v_team_size integer;
  v_main_players integer;
  v_reserved integer;
begin
  select t.entry_fee, t.status, t.registration_deadline, t.max_teams, t.team_size
    into v_entry_fee, v_tournament_status, v_deadline, v_max_teams, v_team_size
  from public.tournaments t
  where t.id = new.tournament_id;

  if not found then raise exception 'Tournament not found.'; end if;

  select tm.captain_id into v_captain
  from public.teams tm where tm.id = new.team_id;
  if not found then raise exception 'Team not found.'; end if;

  if not public.is_admin() and v_captain <> (select auth.uid()) then
    raise exception 'Only the team captain can register this team.';
  end if;

  if tg_op = 'INSERT' then
    if new.accepted_terms_at is null or new.accepted_terms_at > now() then
      raise exception 'Terms must be accepted at registration time.';
    end if;

    if not public.is_admin() then
      if v_tournament_status not in ('open','starting_soon') then
        raise exception 'This tournament is not accepting registrations.';
      end if;
      if current_date > v_deadline then
        raise exception 'The registration deadline has passed.';
      end if;
    end if;

    select count(*) into v_main_players
    from public.team_players tp
    where tp.team_id = new.team_id and tp.is_substitute = false;

    if v_main_players <> v_team_size then
      raise exception 'Team roster must contain exactly % main players for this tournament.', v_team_size;
    end if;

    select count(*) into v_reserved
    from public.registrations r
    where r.tournament_id = new.tournament_id
      and r.status in ('payment_pending','confirmed');

    if v_reserved >= v_max_teams then raise exception 'This tournament is full.'; end if;

    if v_entry_fee > 0 then new.status := 'payment_pending';
    else new.status := 'confirmed';
    end if;
    new.updated_at := now();
  else
    if not public.is_admin() then
      if new.status is distinct from old.status
         or new.tournament_id is distinct from old.tournament_id
         or new.team_id is distinct from old.team_id
         or new.accepted_terms_at is distinct from old.accepted_terms_at then
        raise exception 'Registration status and ownership can only be changed by an admin.';
      end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_enforce_integrity on public.registrations;
create trigger registrations_enforce_integrity
before insert or update on public.registrations
for each row execute function public.enforce_registration_integrity();

-- Payment amount and payment state are enforced by the database.
create or replace function public.enforce_payment_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected numeric(10,2);
  v_registration_status text;
begin
  select t.entry_fee, r.status into v_expected, v_registration_status
  from public.registrations r
  join public.tournaments t on t.id = r.tournament_id
  where r.id = new.registration_id;

  if not found then raise exception 'Registration not found.'; end if;
  if v_registration_status <> 'payment_pending' and not public.is_admin() then
    raise exception 'This registration is not awaiting payment.';
  end if;
  if new.amount <> v_expected then
    raise exception 'Payment amount does not match the tournament entry fee.';
  end if;
  if not public.is_admin() then new.status := 'pending'; end if;
  return new;
end;
$$;

drop trigger if exists payments_enforce_amount on public.payments;
drop trigger if exists payments_enforce_integrity on public.payments;
create trigger payments_enforce_integrity
before insert on public.payments
for each row execute function public.enforce_payment_integrity();

-- Match-room credentials are sensitive and must not live in the public
-- schedule rows.
create table if not exists public.match_rooms (
  match_id uuid primary key references public.matches(id) on delete cascade,
  room_id text check (room_id is null or char_length(trim(room_id)) between 1 and 40),
  room_password text check (room_password is null or char_length(trim(room_password)) between 1 and 40),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.match_rooms enable row level security;

drop policy if exists "admins manage match rooms" on public.match_rooms;
drop policy if exists "participating captains view match room" on public.match_rooms;

create policy "admins manage match rooms"
on public.match_rooms for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "participating captains view match room"
on public.match_rooms for select
to authenticated
using (
  exists (
    select 1 from public.matches m
    join public.teams t on t.id = m.team_a_id or t.id = m.team_b_id
    where m.id = match_rooms.match_id and t.captain_id = (select auth.uid())
  )
);

grant select on public.match_rooms to authenticated;
grant insert, update, delete on public.match_rooms to authenticated;

alter table public.matches drop column if exists room_id;
alter table public.matches drop column if exists room_password;

drop policy if exists "public can view matches" on public.matches;
drop policy if exists "players can view their matches" on public.matches;

create policy "players can view their matches"
on public.matches for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1 from public.teams t
    where (t.id = matches.team_a_id or t.id = matches.team_b_id)
      and t.captain_id = (select auth.uid())
  )
);

-- Safe public schedule endpoint. It returns only non-sensitive match fields.
-- The underlying matches table is not publicly selectable.
drop function if exists public.get_public_matches();

create or replace function public.get_public_matches()
returns table (
  id uuid,
  tournament_id uuid,
  round text,
  match_number integer,
  team_a_id uuid,
  team_b_id uuid,
  team_a_label text,
  team_b_label text,
  score_a integer,
  score_b integer,
  kills_a integer,
  kills_b integer,
  winner_team_id uuid,
  status text,
  scheduled_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, m.tournament_id, m.round, m.match_number,
    m.team_a_id, m.team_b_id, m.team_a_label, m.team_b_label,
    m.score_a, m.score_b, m.kills_a, m.kills_b,
    m.winner_team_id, m.status, m.scheduled_at
  from public.matches m
  join public.tournaments t on t.id = m.tournament_id
  where t.status <> 'draft'
  order by m.scheduled_at asc;
$$;

revoke all on function public.get_public_matches() from public, anon, authenticated;
grant execute on function public.get_public_matches() to anon, authenticated;

-- Trigger-only functions are not public RPC endpoints.
revoke execute on function public.prevent_self_role_escalation() from public, anon, authenticated;
revoke execute on function public.enforce_registration_integrity() from public, anon, authenticated;
revoke execute on function public.enforce_payment_integrity() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- These are intentionally used by the frontend/RLS.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.tournament_team_counts() to anon, authenticated;

-- Make future public-schema functions opt-in rather than automatically
-- callable through the Data API.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
