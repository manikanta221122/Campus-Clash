-- Campus Clash: production data model and row-level security.
-- Run this migration in a new Supabase project before connecting the frontend.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 100),
  college_id text unique,
  role text not null default 'player' check (role in ('player', 'admin')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 140),
  game text not null,
  host text not null default 'Campus Clash Esports Cell',
  description text not null default '',
  entry_fee numeric(10,2) not null default 0 check (entry_fee >= 0),
  prize_pool numeric(10,2) not null default 0 check (prize_pool >= 0),
  first_prize numeric(10,2) not null default 0 check (first_prize >= 0),
  second_prize numeric(10,2) not null default 0 check (second_prize >= 0),
  third_prize numeric(10,2) not null default 0 check (third_prize >= 0),
  max_teams integer not null default 16 check (max_teams between 2 and 256),
  registration_deadline date not null,
  start_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'starting_soon', 'live', 'completed', 'cancelled')),
  rules jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (first_prize + second_prize + third_prize <= prize_pool),
  check (start_date >= registration_deadline)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  tag text not null check (char_length(trim(tag)) between 2 and 8),
  college text not null,
  captain_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (captain_id, name)
);

create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  player_name text not null,
  college_id text not null,
  game_uid text not null,
  ign text not null,
  is_substitute boolean not null default false,
  created_at timestamptz not null default now(),
  unique (team_id, game_uid)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  status text not null default 'payment_pending' check (status in ('payment_pending', 'confirmed', 'rejected', 'withdrawn')),
  accepted_terms_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null unique references public.registrations(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  provider text not null default 'manual_upi',
  provider_payment_id text,
  utr text unique,
  payer_upi text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'refunded')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  review_note text
);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  placement text not null,
  recipient_name text not null,
  recipient_upi text not null,
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  recorded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index registrations_tournament_status_idx on public.registrations(tournament_id, status);
create index payments_status_idx on public.payments(status);
create index team_players_team_idx on public.team_players(team_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, college_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Campus Player'), nullif(new.raw_user_meta_data->>'college_id', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.team_players enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.audit_logs enable row level security;

create policy "public can view published tournaments" on public.tournaments for select using (status <> 'draft' or public.is_admin());
create policy "admins manage tournaments" on public.tournaments for all using (public.is_admin()) with check (public.is_admin());
create policy "authenticated can view teams" on public.teams for select to authenticated using (true);
create policy "captains create teams" on public.teams for insert to authenticated with check (captain_id = auth.uid());
create policy "captains update their teams" on public.teams for update to authenticated using (captain_id = auth.uid()) with check (captain_id = auth.uid());
create policy "admins manage teams" on public.teams for all using (public.is_admin()) with check (public.is_admin());
create policy "captains and admins view team players" on public.team_players for select to authenticated using (exists (select 1 from public.teams where teams.id = team_players.team_id and teams.captain_id = auth.uid()) or public.is_admin());
create policy "captains add team players" on public.team_players for insert to authenticated with check (exists (select 1 from public.teams where teams.id = team_players.team_id and teams.captain_id = auth.uid()));
create policy "captains view registrations" on public.registrations for select to authenticated using (exists (select 1 from public.teams where teams.id = registrations.team_id and teams.captain_id = auth.uid()) or public.is_admin());
create policy "captains create registrations" on public.registrations for insert to authenticated with check (exists (select 1 from public.teams where teams.id = registrations.team_id and teams.captain_id = auth.uid()));
create policy "admins manage registrations" on public.registrations for all using (public.is_admin()) with check (public.is_admin());
create policy "owners and admins view payments" on public.payments for select to authenticated using (public.is_admin() or exists (select 1 from public.registrations join public.teams on teams.id = registrations.team_id where registrations.id = payments.registration_id and teams.captain_id = auth.uid()));
create policy "owners submit payments" on public.payments for insert to authenticated with check (exists (select 1 from public.registrations join public.teams on teams.id = registrations.team_id where registrations.id = payments.registration_id and teams.captain_id = auth.uid()));
create policy "admins manage payments" on public.payments for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage payouts" on public.payouts for all using (public.is_admin()) with check (public.is_admin());
create policy "admins view audit logs" on public.audit_logs for select using (public.is_admin());

revoke all on public.profiles, public.tournaments, public.teams, public.team_players, public.registrations, public.payments, public.payouts, public.audit_logs from anon;
grant select on public.tournaments to anon;
grant select, insert, update on public.teams, public.team_players, public.registrations, public.payments to authenticated;
grant select on public.profiles, public.tournaments, public.teams, public.team_players, public.registrations, public.payments to authenticated;
