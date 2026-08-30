-- Adds on top of 20260829190000_initial_schema.sql and 20260829200000_profile_and_count_fixes.sql:
-- 1. A `matches` table for the bracket/schedule/results system (previously mock
--    data in src/data/matches.js). Public can view matches for any tournament
--    they can already see; only admins can create/update them.
-- 2. `/schedule` and `/leaderboard` are meant to be public pages, but `teams`
--    only had an `authenticated`-only select policy — a logged-out visitor
--    could not see team names. This adds an anon-readable policy for teams
--    (name/tag/college/captain_id only — no roster/contact details, those
--    stay on `team_players` which is unaffected by this migration).

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round text not null check (char_length(trim(round)) between 1 and 60),
  match_number integer not null default 1 check (match_number > 0),
  team_a_id uuid references public.teams(id) on delete set null,
  team_b_id uuid references public.teams(id) on delete set null,
  team_a_label text,
  team_b_label text,
  score_a integer check (score_a >= 0),
  score_b integer check (score_b >= 0),
  kills_a integer not null default 0 check (kills_a >= 0),
  kills_b integer not null default 0 check (kills_b >= 0),
  winner_team_id uuid references public.teams(id) on delete set null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'completed', 'cancelled')),
  scheduled_at timestamptz not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (team_a_id is null or team_b_id is null or team_a_id <> team_b_id),
  check (winner_team_id is null or winner_team_id = team_a_id or winner_team_id = team_b_id),
  unique (tournament_id, round, match_number)
);

create index matches_tournament_idx on public.matches(tournament_id);
create index matches_status_idx on public.matches(status);
create index matches_team_a_idx on public.matches(team_a_id);
create index matches_team_b_idx on public.matches(team_b_id);

alter table public.matches enable row level security;

create policy "public can view matches" on public.matches
  for select using (
    exists (
      select 1 from public.tournaments t
      where t.id = matches.tournament_id and (t.status <> 'draft' or public.is_admin())
    )
  );

create policy "admins manage matches" on public.matches
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.matches to anon, authenticated;
grant insert, update, delete on public.matches to authenticated;

-- Public schedule/leaderboard visibility for teams.
create policy "anon can view teams" on public.teams
  for select to anon using (true);

grant select on public.teams to anon;
