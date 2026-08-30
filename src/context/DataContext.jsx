import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { notifications as seedNotifications } from "../data/notifications-shim";
import { findMode } from "../data/gameMeta";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

// NOTE on scope: `notifications` has no backing table in the Supabase schema
// yet, so it stays on local seed data. Everything else on this page —
// tournaments, teams, registrations, payments, payouts, and matches/results —
// is wired to real Supabase tables.

const DataContext = createContext(null);

const WIN_POINTS = 3;
const KILL_POINTS = 1;

function mapTournament(row, confirmedCounts) {
  return {
    id: row.id,
    name: row.name,
    game: row.game,
    mode: row.mode,
    teamSize: row.team_size,
    host: row.host,
    organizer: row.host,
    banner: "linear-gradient(135deg,#1a0b2e,#0b0e16 60%)",
    description: row.description,
    entryFee: Number(row.entry_fee),
    prizePool: Number(row.prize_pool),
    prizeSplit: { first: Number(row.first_prize), second: Number(row.second_prize), third: Number(row.third_prize) },
    maxTeams: row.max_teams,
    registeredTeams: confirmedCounts[row.id] ?? 0,
    registrationDeadline: row.registration_deadline,
    startDate: row.start_date,
    status: row.status,
    rules: row.rules || [],
  };
}

function mapPlayer(row) {
  return {
    name: row.player_name,
    collegeId: row.college_id,
    gameUid: row.game_uid,
    ign: row.ign,
    substitute: row.is_substitute,
  };
}

// Base team shape — no wins/matches/kills/points here, those are derived
// from real match results in `deriveTeamsWithStats` below, once matches
// have loaded, so they can't go stale independently of each other.
function mapTeamBase(row, playerRows, registrationRows, profileNameById) {
  const ownRegistrations = registrationRows.filter((r) => r.team_id === row.id);
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    college: row.college,
    captainUserId: row.captain_id,
    captain: profileNameById[row.captain_id] || "",
    logo: "🎮",
    players: playerRows.filter((p) => p.team_id === row.id).map(mapPlayer),
    tournamentIds: ownRegistrations.map((r) => r.tournament_id),
    registrationStatus: ownRegistrations[0]?.status || "confirmed",
  };
}

function mapPayment(row, regById) {
  const reg = regById[row.registration_id];
  return {
    id: row.id,
    registrationId: row.registration_id,
    teamId: reg?.team_id,
    tournamentId: reg?.tournament_id,
    amount: Number(row.amount),
    utr: row.utr,
    payerUpi: row.payer_upi,
    status: row.status,
    createdAt: row.submitted_at,
  };
}

function mapPayout(row) {
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    placement: row.placement,
    recipient: row.recipient_name,
    upiId: row.recipient_upi,
    amount: Number(row.amount),
    status: row.status,
    paidAt: row.paid_at,
  };
}

function formatMatchDate(scheduledAt) {
  if (!scheduledAt) return { date: "", time: "" };
  const d = new Date(scheduledAt);
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
  };
}

// Maps a raw `matches` row into the shape the UI already expects (teamA/teamB
// as display names, date/time strings) — this keeps MatchRow, Bracket,
// Schedule, TournamentDetails etc. working unchanged.
function mapMatch(row, teamNameById) {
  const { date, time } = formatMatchDate(row.scheduled_at);
  return {
    id: row.id,
    tournamentId: row.tournament_id,
    round: row.round,
    matchNumber: row.match_number,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    teamA: (row.team_a_id && teamNameById[row.team_a_id]) || row.team_a_label || "TBD",
    teamB: (row.team_b_id && teamNameById[row.team_b_id]) || row.team_b_label || "TBD",
    scoreA: row.score_a,
    scoreB: row.score_b,
    killsA: row.kills_a,
    killsB: row.kills_b,
    winnerTeamId: row.winner_team_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    roomId: row.room_id,
    roomPassword: row.room_password,
    date,
    time,
  };
}

// Derives wins / matches played / kills / points for one team from completed
// match rows. Points = wins * 3 + kills * 1 (kills only accrue for
// battle-royale style games where kills_a/kills_b are actually entered;
// they're harmlessly 0 for everything else).
function computeTeamStats(teamId, matchRows) {
  const played = matchRows.filter(
    (m) => m.status === "completed" && (m.team_a_id === teamId || m.team_b_id === teamId)
  );
  const wins = played.filter((m) => m.winner_team_id === teamId).length;
  const kills = played.reduce((sum, m) => {
    if (m.team_a_id === teamId) return sum + (m.kills_a || 0);
    if (m.team_b_id === teamId) return sum + (m.kills_b || 0);
    return sum;
  }, 0);
  return { matches: played.length, wins, kills, points: wins * WIN_POINTS + kills * KILL_POINTS };
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [teamsBase, setTeamsBase] = useState([]);
  const [matchesRaw, setMatchesRaw] = useState([]);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const refreshTournaments = useCallback(async () => {
    const [{ data: rows, error }, { data: counts }] = await Promise.all([
      supabase.from("tournaments").select("*").order("created_at", { ascending: false }),
      supabase.rpc("tournament_team_counts"),
    ]);
    if (error) { console.error(error.message); return; }
    const countMap = {};
    (counts || []).forEach((c) => { countMap[c.tournament_id] = Number(c.confirmed_teams); });
    setTournaments((rows || []).map((row) => mapTournament(row, countMap)));
  }, []);

  const refreshTeams = useCallback(async () => {
    const [{ data: teamRows, error }, { data: playerRows }, { data: registrationRows }, { data: profileRows }] = await Promise.all([
      supabase.from("teams").select("*"),
      supabase.from("team_players").select("*"),
      supabase.from("registrations").select("*"),
      // RLS only returns your own profile (or all of them if you're an admin) — that's expected, not a bug.
      supabase.from("profiles").select("id, full_name"),
    ]);
    if (error) { console.error(error.message); return; }
    const profileNameById = Object.fromEntries((profileRows || []).map((p) => [p.id, p.full_name]));
    setTeamsBase((teamRows || []).map((row) => mapTeamBase(row, playerRows || [], registrationRows || [], profileNameById)));
  }, []);

  const refreshMatches = useCallback(async () => {
    const { data, error } = await supabase.from("matches").select("*").order("scheduled_at", { ascending: true });
    if (error) { console.error(error.message); return; }
    setMatchesRaw(data || []);
  }, []);

  const refreshPayments = useCallback(async () => {
    const [{ data: payRows, error }, { data: regRows }] = await Promise.all([
      supabase.from("payments").select("*").order("submitted_at", { ascending: false }),
      supabase.from("registrations").select("id, team_id, tournament_id"),
    ]);
    if (error) { console.error(error.message); return; }
    const regById = Object.fromEntries((regRows || []).map((r) => [r.id, r]));
    setPayments((payRows || []).map((row) => mapPayment(row, regById)));
  }, []);

  const refreshPayouts = useCallback(async () => {
    const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error.message); return; }
    setPayouts((data || []).map(mapPayout));
  }, []);

  useEffect(() => { refreshTournaments(); }, [refreshTournaments]);
  useEffect(() => { refreshTeams(); }, [user, refreshTeams]);
  useEffect(() => { refreshMatches(); }, [refreshMatches]);
  useEffect(() => {
    if (user) {
      refreshPayments();
      if (user.role === "admin") refreshPayouts();
    } else {
      setPayments([]);
      setPayouts([]);
    }
  }, [user, refreshPayments, refreshPayouts]);

  // Derived, always-consistent views: team display names for matches, and
  // wins/kills/points for teams, both computed from the same match rows.
  const teamNameById = useMemo(() => Object.fromEntries(teamsBase.map((t) => [t.id, t.name])), [teamsBase]);
  const matches = useMemo(() => matchesRaw.map((row) => mapMatch(row, teamNameById)), [matchesRaw, teamNameById]);
  const teams = useMemo(
    () => teamsBase.map((t) => ({ ...t, ...computeTeamStats(t.id, matchesRaw) })),
    [teamsBase, matchesRaw]
  );

  const notify = (text) => setNotifications((prev) => [{ id: `n${Date.now()}`, text, time: "Just now", read: false }, ...prev]);

  const registerTeam = async (tournamentId, teamData) => {
    if (!user) throw new Error("Please log in before registering a team.");
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament) throw new Error("Tournament not found.");

    const mainRosterCount = teamData.players.filter((p) => !p.substitute).length;
    if (mainRosterCount !== tournament.teamSize) {
      throw new Error(`This tournament's mode (${tournament.mode}) needs exactly ${tournament.teamSize} player${tournament.teamSize > 1 ? "s" : ""} per team.`);
    }

    const tag = teamData.teamName.trim().slice(0, 3).toUpperCase() || "TM";
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({ name: teamData.teamName.trim(), tag, college: "KL University", captain_id: user.id })
      .select()
      .single();
    if (teamError) {
      throw new Error(teamError.message.includes("duplicate") ? "You already have a team with that name — pick a different name." : teamError.message);
    }

    const playerRows = teamData.players.map((p) => ({
      team_id: team.id,
      player_name: p.name,
      college_id: p.collegeId,
      game_uid: p.gameUid,
      ign: p.ign,
      is_substitute: Boolean(p.substitute),
    }));
    const { error: playersError } = await supabase.from("team_players").insert(playerRows);
    if (playersError) throw new Error(playersError.message);

    const status = Number(tournament.entryFee) > 0 ? "payment_pending" : "confirmed";
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert({ tournament_id: tournamentId, team_id: team.id, status, accepted_terms_at: new Date().toISOString() })
      .select()
      .single();
    if (regError) throw new Error(regError.message);

    await refreshTeams();
    if (status === "confirmed") await refreshTournaments();
    notify(`Your team "${team.name}" registration was successful.`);

    return { id: team.id, name: team.name, registrationId: registration.id, registrationStatus: registration.status };
  };

  const submitPayment = async (tournamentId, teamId, details) => {
    const tournament = tournaments.find((t) => t.id === tournamentId);
    if (!tournament || !details.utr?.trim()) throw new Error("Enter the UPI transaction reference.");

    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .single();
    if (regError || !registration) throw new Error("Registration not found.");

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({ registration_id: registration.id, amount: tournament.entryFee, utr: details.utr.trim(), payer_upi: details.payerUpi?.trim() })
      .select()
      .single();
    if (error) {
      throw new Error(error.message.includes("duplicate") ? "That UPI transaction reference has already been submitted." : error.message);
    }

    await refreshPayments();
    notify(`UPI payment submitted for review for ${tournament.name}.`);
    return { id: payment.id, teamId, tournamentId, amount: Number(payment.amount), utr: payment.utr, status: payment.status };
  };

  const reviewPayment = async (paymentId, approved) => {
    const { data: payment, error: fetchError } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (fetchError || !payment) throw new Error("Payment not found.");
    if (payment.status !== "pending") return;

    const status = approved ? "approved" : "rejected";
    const { error } = await supabase
      .from("payments")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", paymentId);
    if (error) throw new Error(error.message);

    const { error: regUpdateError } = await supabase
      .from("registrations")
      .update({ status: approved ? "confirmed" : "rejected" })
      .eq("id", payment.registration_id);
    if (regUpdateError) throw new Error(regUpdateError.message);

    await Promise.all([refreshPayments(), refreshTeams(), refreshTournaments()]);
  };

  const recordPayout = async (tournamentId, placement, recipient, upiId, amount) => {
    if (!recipient?.trim() || !upiId?.trim() || !Number(amount)) throw new Error("Recipient, UPI ID, and payout amount are required.");
    const tournament = tournaments.find((t) => t.id === tournamentId);
    const paidSoFar = payouts.filter((p) => p.tournamentId === tournamentId).reduce((sum, p) => sum + p.amount, 0);
    if (tournament && paidSoFar + Number(amount) > tournament.prizePool) throw new Error("Payout exceeds the advertised prize pool.");

    const { data, error } = await supabase
      .from("payouts")
      .insert({
        tournament_id: tournamentId,
        placement: placement?.trim() || "Prize",
        recipient_name: recipient.trim(),
        recipient_upi: upiId.trim(),
        amount: Number(amount),
        status: "paid",
        paid_at: new Date().toISOString(),
        recorded_by: user.id,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await refreshPayouts();
    return mapPayout(data);
  };

  const createTournament = async (data, actingUser) => {
    if (actingUser?.role !== "admin") throw new Error("Only administrators can create tournaments.");
    const prizePool = Number(data.prizePool) || 0;
    const firstPrize = Number(data.firstPrize) || 0;
    const secondPrize = Number(data.secondPrize) || 0;
    const thirdPrize = Number(data.thirdPrize) || 0;
    if (firstPrize + secondPrize + thirdPrize > prizePool) throw new Error("Prize split cannot be more than the advertised prize pool.");
    const mode = findMode(data.game, data.mode);
    if (!mode) throw new Error("Choose a valid game mode.");

    const { data: row, error } = await supabase
      .from("tournaments")
      .insert({
        name: data.name.trim(),
        game: data.game,
        mode: mode.id,
        team_size: mode.teamSize,
        host: "Campus Clash Esports Cell",
        description: data.description?.trim() || "",
        entry_fee: Number(data.entryFee || 0),
        prize_pool: prizePool,
        first_prize: firstPrize,
        second_prize: secondPrize,
        third_prize: thirdPrize,
        max_teams: Number(data.maxTeams || 16),
        registration_deadline: data.registrationDeadline,
        start_date: data.startDate,
        status: "open",
        rules: data.rules ? data.rules.split("\n").filter(Boolean) : [],
        created_by: actingUser.id,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await refreshTournaments();
    return mapTournament(row, {});
  };

  // --- Matches / results -----------------------------------------------

  const createMatch = async (data) => {
    if (user?.role !== "admin") throw new Error("Only administrators can create matches.");
    if (!data.tournamentId || !data.round?.trim() || !data.scheduledAt) {
      throw new Error("Tournament, round, and scheduled time are required.");
    }
    if (!data.teamAId && !data.teamALabel?.trim()) throw new Error("Set Team A or a placeholder label (e.g. \"TBD\").");
    if (!data.teamBId && !data.teamBLabel?.trim()) throw new Error("Set Team B or a placeholder label (e.g. \"TBD\").");

    const { data: row, error } = await supabase
      .from("matches")
      .insert({
        tournament_id: data.tournamentId,
        round: data.round.trim(),
        match_number: Number(data.matchNumber) || 1,
        team_a_id: data.teamAId || null,
        team_b_id: data.teamBId || null,
        team_a_label: data.teamAId ? null : data.teamALabel.trim(),
        team_b_label: data.teamBId ? null : data.teamBLabel.trim(),
        scheduled_at: new Date(data.scheduledAt).toISOString(),
        room_id: data.roomId?.trim() || null,
        room_password: data.roomPassword?.trim() || null,
        status: "upcoming",
        created_by: user.id,
      })
      .select()
      .single();
    if (error) {
      throw new Error(error.message.includes("duplicate") ? "That round already has a match with this number for this tournament." : error.message);
    }

    await refreshMatches();
    return row;
  };

  // Persists score/kills/status for a match. When marking a match completed
  // with a decisive score, the winner is derived automatically; ties are
  // left with no winner (no bonus win points to either side).
  const updateMatchResult = async (matchId, patch) => {
    if (user?.role !== "admin") throw new Error("Only administrators can update match results.");
    const current = matchesRaw.find((m) => m.id === matchId);
    if (!current) throw new Error("Match not found.");

    const scoreA = patch.scoreA === "" || patch.scoreA === undefined ? current.score_a : Number(patch.scoreA);
    const scoreB = patch.scoreB === "" || patch.scoreB === undefined ? current.score_b : Number(patch.scoreB);
    const status = patch.status || current.status;

    let winnerTeamId = current.winner_team_id;
    if (status === "completed" && current.team_a_id && current.team_b_id && scoreA != null && scoreB != null) {
      if (scoreA > scoreB) winnerTeamId = current.team_a_id;
      else if (scoreB > scoreA) winnerTeamId = current.team_b_id;
      else winnerTeamId = null; // tie — no winner
    } else if (status !== "completed") {
      winnerTeamId = null;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        score_a: scoreA,
        score_b: scoreB,
        kills_a: patch.killsA === "" || patch.killsA === undefined ? current.kills_a : Number(patch.killsA),
        kills_b: patch.killsB === "" || patch.killsB === undefined ? current.kills_b : Number(patch.killsB),
        status,
        winner_team_id: winnerTeamId,
        // Announcing the room: admin fills these in whenever they're ready
        // (usually right before the match starts). Blank clears it.
        room_id: patch.roomId === undefined ? current.room_id : patch.roomId.trim() || null,
        room_password: patch.roomPassword === undefined ? current.room_password : patch.roomPassword.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", matchId);
    if (error) throw new Error(error.message);

    await refreshMatches();
  };

  // Fills in a team slot once it's known (e.g. turning "Winner M4" into the
  // real team that advanced) without touching the rest of the match row.
  const setMatchTeam = async (matchId, slot, teamId) => {
    if (user?.role !== "admin") throw new Error("Only administrators can edit matches.");
    const column = slot === "A" ? "team_a_id" : "team_b_id";
    const labelColumn = slot === "A" ? "team_a_label" : "team_b_label";
    const { error } = await supabase.from("matches").update({ [column]: teamId, [labelColumn]: null }).eq("id", matchId);
    if (error) throw new Error(error.message);
    await refreshMatches();
  };

  return (
    <DataContext.Provider
      value={{
        tournaments,
        teams,
        matches,
        notifications,
        payments,
        payouts,
        registerTeam,
        submitPayment,
        reviewPayment,
        recordPayout,
        createTournament,
        createMatch,
        updateMatchResult,
        setMatchTeam,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
