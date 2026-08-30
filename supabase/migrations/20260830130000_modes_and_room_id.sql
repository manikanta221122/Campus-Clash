-- Adds on top of the previous three migrations:
-- 1. `mode` + `team_size` on `tournaments` — a tournament now picks a specific
--    game mode (e.g. Free Fire Battle Royale Squad, Clash Squad 4v4, Lone Wolf
--    1v1), and the number of players per team is derived from that mode
--    instead of being freely typed by the admin. `team_size` is what
--    TeamRegistration.jsx uses to render the right number of player slots.
-- 2. `room_id` + `room_password` on `matches` — the admin announces the
--    in-game custom room ID (and optional password) per match, whenever
--    they're ready to (usually right before that match starts). Nullable:
--    a match can exist on the schedule with no room details yet.

alter table public.tournaments
  add column mode text not null default 'br_squad' check (char_length(trim(mode)) between 2 and 40),
  add column team_size integer not null default 4 check (team_size between 1 and 6);

alter table public.matches
  add column room_id text check (room_id is null or char_length(trim(room_id)) between 1 and 40),
  add column room_password text check (room_password is null or char_length(trim(room_password)) between 1 and 40);

-- No RLS changes needed: existing row-level policies on `tournaments` and
-- `matches` already govern these new columns the same way as the rest of
-- each row (public/anon can read, only admins can write).
