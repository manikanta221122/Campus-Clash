# Campus Clash 🎮

A dark, premium esports tournament platform for college gaming — built for KL University, starting with **Free Fire**, architected so BGMI, Valorant, FIFA, and COD Mobile can be added later.

Backend: **Supabase** (Auth + Postgres + Row Level Security). There is no separate server to host — this is a static frontend that talks directly to Supabase.

---

## 1. Project Structure

```
campus-clash/
├── src/
│   ├── components/        # Reusable UI: Navbar, Footer, Layout, TournamentCard,
│   │                       # StatusBadge, MatchRow, Bracket, LeaderboardTable
│   ├── context/
│   │   ├── AuthContext.jsx   # Supabase Auth (signup/login/logout) + profile (role) lookup
│   │   └── DataContext.jsx   # Reads/writes tournaments, teams, registrations, payments, payouts in Supabase
│   ├── data/               # Local-only seed data: notifications (see §4), gameMeta (modes/team sizes)
│   ├── lib/
│   │   └── supabase.js      # Supabase client (reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)
│   ├── pages/               # One component per route (see routing table below)
│   ├── App.jsx               # All routes
│   ├── main.jsx               # Providers + BrowserRouter
│   └── index.css               # Design tokens, Tailwind layers, the "panel"/"btn-primary" component classes
├── supabase/migrations/     # SQL migrations — run these against your Supabase project, in order
├── tailwind.config.js       # Color palette, fonts, glow shadows, animations
└── index.html                # Google Fonts (Orbitron, Rajdhani, Inter)
```

### Routes
| Path | Page |
|---|---|
| `/` | Home (hero, active tournaments, how-it-works) |
| `/tournaments` | Discovery — search, filter by game/status, sort |
| `/tournaments/:id` | Details — Overview / Rules / Teams / Schedule / Bracket / Leaderboard tabs |
| `/tournaments/:id/register` | Team registration form |
| `/tournaments/:id/payment` | UPI payment claim (UTR submission) |
| `/schedule` | Global match schedule |
| `/leaderboard` | Global leaderboard |
| `/match/:id` | Live match view |
| `/login`, `/signup` | Auth |
| `/dashboard` | Player dashboard |
| `/admin` | Admin panel — create tournaments, review payments, record payouts |
| `/profile` | Player profile |
| `/notifications` | Notification inbox |
| `/team/:id` | Team profile |

---

## 2. How to Run It

### 2a. Set up Supabase (one time)

1. In your Supabase project's SQL editor, run the migrations **in order**:
   - `supabase/migrations/20260829190000_initial_schema.sql`
   - `supabase/migrations/20260829200000_profile_and_count_fixes.sql`
     (this second one is new — the first migration enabled Row Level Security on `profiles` but never added a policy letting a user read their own profile, which the app needs right after login. It also adds a safe way to show public team-count numbers without exposing who registered.)
   - `supabase/migrations/20260830120000_matches_and_public_visibility.sql` (adds the `matches` table for schedule/bracket/results, plus public visibility for teams)
   - `supabase/migrations/20260830130000_modes_and_room_id.sql` (adds `mode` + `team_size` to `tournaments`, and `room_id` + `room_password` to `matches`)
2. In **Authentication → Providers**, confirm Email is enabled. In **Authentication → Settings**, decide whether you want "Confirm email" on — if it's on, new signups won't get a session until they click the emailed link (the app shows a message telling them to check their email).
3. Copy `.env.example` to `.env.local` and fill in your project's URL and publishable (anon) key from **Settings → API**. (Yours is already filled in with a live project.)
4. **Create your admin account:** sign up normally through `/signup` — this creates you as a `player`. Then in the SQL editor, promote yourself:
   ```sql
   update public.profiles set role = 'admin' where college_id = 'YOUR_COLLEGE_ID';
   ```
   Log out and back in; you'll land on `/admin`.

### 2b. Run the frontend

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

To build for production:
```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

**Try the flow:** sign up a player account, register a team for a paid tournament, submit a UPI reference on the payment page, then log in as admin and approve it under Admin → Payments.

---

## 3. How to Add Tournaments

As an **admin**, log in and go to `/admin` → **Create Tournament** → fill the form, including the **Mode** dropdown (e.g. Free Fire Battle Royale Squad, Clash Squad 4v4, Lone Wolf 1v1). It's inserted directly into the `tournaments` table and shows up on `/tournaments` immediately for everyone.

There's no code-based seed path anymore — tournaments are real rows created through the admin UI.

### 3a. Modes & team size

Each game has a fixed list of modes in `src/data/gameMeta.js` (`gameModes`), and every mode carries a `teamSize` (Solo = 1, Duo = 2, Squad/Clash Squad = 4, etc.). Whichever mode the admin picks when creating a tournament decides how many player slots `TeamRegistration.jsx` renders for captains — so a Duo tournament asks for 2 players, a Squad tournament asks for 4, and so on. `registerTeam` also rejects a roster that doesn't match, server-side.

To add a new mode (or a new game's mode list), just add an entry to `gameModes` in `src/data/gameMeta.js` — no migration needed, since `mode` is a free-text column.

### 3b. Room ID / password ("announce at match time")

Every row in `matches` has an optional `room_id` and `room_password`. The admin can leave these blank when first scheduling a match, then fill them in later — from **Admin → Matches** (the match list) or straight from the match's live page (`/match/:id`) — whenever they're ready to announce the custom room, typically right before the match starts. Once set, registered players see a "Room Details" panel on the match page, and the schedule list shows a "Room Out" badge linking there.

---

## 4. Matches, brackets, and leaderboard stats

The Supabase schema covers **accounts, tournaments, team registration, entry-fee payments, prize payouts, and match results** (`matches` table — round, teams, score, kills, status, winner, room ID). `/schedule`, `/leaderboard`, `/match/:id`, and the win/loss numbers on `/team/:id` and `/dashboard` all read from real Supabase rows via `DataContext.jsx`, which derives wins/kills/points per team from completed matches (`computeTeamStats`).

Only `notifications` is still local seed data (see §1) — there's no backing table for it yet.

---

## 5. Payment safety

Payments are **manually verified UPI claims**, not a live payment integration: a player submits a UTR (transaction reference), and an admin cross-checks it against their actual bank/UPI app before approving. The app itself does not verify that money moved — don't approve a payment from a screenshot or UTR alone. Before accepting real money at scale, consider a regulated payment gateway (Razorpay, Cashfree, etc.) with server-side webhooks instead of manual review.

Also note: `.env.local` holds your Supabase URL and **publishable** (anon) key, which is safe to ship in a frontend bundle — that's what it's designed for, and Row Level Security is what actually protects your data. It's already excluded from git via `.gitignore`. Never put a Supabase *service role* key in frontend code.

---

## 6. How to Deploy

**Static hosting (Vercel / Netlify)** — this is a standard Vite SPA:
```bash
npm run build
```
Connect your Git repo to Vercel or Netlify (both auto-detect Vite). Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables in the host's dashboard (don't commit `.env.local`).

Since routing uses `BrowserRouter` (real paths, not `#hash`), make sure your host rewrites all routes to `index.html` — Vercel and Netlify both support this automatically for Vite SPAs (Netlify: add a `_redirects` file with `/* /index.html 200` if it doesn't auto-detect; Vercel: works out of the box).

---

## Legacy files

`server/index.mjs` was an earlier local Node+JSON-file backend used before this project connected to Supabase. It is no longer imported or used by the frontend — everything now goes through `src/lib/supabase.js`. It's left in the repo for reference but can be deleted along with the `server` npm script.
