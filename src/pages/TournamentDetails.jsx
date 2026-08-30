import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Trophy, Users, Wallet, CalendarClock, CalendarCheck, ShieldCheck, CircleDollarSign, Layers } from "lucide-react";
import { useData } from "../context/DataContext";
import StatusBadge from "../components/StatusBadge";
import MatchRow from "../components/MatchRow";
import Bracket from "../components/Bracket";
import LeaderboardTable from "../components/LeaderboardTable";
import { gameMeta, modeLabel } from "../data/gameMeta";

const TABS = ["Overview", "Rules", "Teams", "Schedule", "Bracket", "Leaderboard"];

export default function TournamentDetails() {
  const { id } = useParams();
  const { tournaments, teams, matches } = useData();
  const [tab, setTab] = useState("Overview");

  const tournament = tournaments.find((t) => t.id === id);
  if (!tournament) return <Navigate to="/tournaments" replace />;

  const meta = gameMeta[tournament.game];
  const tournamentTeams = teams.filter((t) => t.tournamentIds?.includes(id));
  const tournamentMatches = matches.filter((m) => m.tournamentId === id);

  const stats = [
    { icon: Trophy, label: "Prize Pool", value: `₹${tournament.prizePool.toLocaleString("en-IN")}` },
    { icon: Wallet, label: "Entry Fee", value: tournament.entryFee ? `₹${tournament.entryFee}` : "Free" },
    { icon: Users, label: "Teams", value: `${tournament.registeredTeams}/${tournament.maxTeams}` },
    { icon: Layers, label: "Format", value: `${modeLabel(tournament.game, tournament.mode)} · ${tournament.teamSize}p` },
    { icon: CalendarClock, label: "Reg. Deadline", value: new Date(tournament.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
    { icon: CalendarCheck, label: "Start Date", value: new Date(tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) },
  ];
  const prizeSplit = tournament.prizeSplit && Object.values(tournament.prizeSplit).some(Boolean) ? tournament.prizeSplit : { first: Math.round(tournament.prizePool * 0.5), second: Math.round(tournament.prizePool * 0.3), third: Math.round(tournament.prizePool * 0.2) };

  return (
    <div>
      <div className="relative border-b border-white/10" style={{ background: tournament.banner }}>
        <div className="absolute inset-0 bg-grid-lines bg-[size:40px_40px] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{meta.icon}</span>
            <span className="hud-label text-slate-300">{meta.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-400 font-hud">{tournament.host}</span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="font-display font-black text-3xl md:text-5xl text-white max-w-2xl leading-tight">{tournament.name}</h1>
            <StatusBadge status={tournament.status} />
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-3xl">
            {stats.map((s) => (
              <div key={s.label} className="panel p-3">
                <s.icon size={15} className="text-cyan-400 mb-2" />
                <p className="font-hud font-bold text-white text-sm">{s.value}</p>
                <p className="hud-label text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {tournament.status === "open" && (
            <Link to={`/tournaments/${id}/register`} className="btn-primary inline-flex mt-8">
              Register Your Team
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-1 border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 font-hud text-sm uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                tab === t ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Overview" && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h3 className="font-display font-bold text-white text-lg mb-3">About this tournament</h3>
              <p className="text-slate-400 leading-relaxed">{tournament.description}</p>
            </div>
            <div className="panel p-5 h-fit">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-cyan-400" />
                <p className="hud-label">Eligibility</p>
              </div>
              <p className="text-sm text-slate-400">Open to all verified students of KL University. College ID and email verification required at registration.</p>
            </div>
            <div className="panel p-5 h-fit">
              <div className="flex items-center gap-2 mb-3"><CircleDollarSign size={16} className="text-volt-400" /><p className="hud-label">Prize & payment policy</p></div>
              <div className="text-sm text-slate-400 space-y-2"><p>Prize money: 1st ₹{Number(prizeSplit.first).toLocaleString("en-IN")}, 2nd ₹{Number(prizeSplit.second).toLocaleString("en-IN")}, 3rd ₹{Number(prizeSplit.third).toLocaleString("en-IN")}.</p><p>Only these published placements receive prize money. Entry is confirmed only after payment approval; refunds follow the published event policy.</p></div>
            </div>
          </div>
        )}

        {tab === "Rules" && (
          <div className="max-w-2xl">
            <h3 className="font-display font-bold text-white text-lg mb-4">Tournament Rules</h3>
            {tournament.rules.length === 0 ? (
              <p className="text-slate-500 text-sm">Rules will be published closer to the tournament date.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {tournament.rules.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="font-display font-bold text-volt-400 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    {r}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "Teams" && (
          <div>
            {tournamentTeams.length === 0 ? (
              <p className="text-slate-500 text-sm">No teams registered yet. Be the first to register!</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournamentTeams.map((team) => (
                  <Link to={`/team/${team.id}`} key={team.id} className="panel p-4 flex items-center gap-3 hover:border-cyan-500/40 transition-colors">
                    <span className="text-2xl">{team.logo}</span>
                    <div>
                      <p className="font-hud font-semibold text-white text-sm">{team.name}</p>
                      <p className="text-xs text-slate-500">Captain: {team.captain}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "Schedule" && (
          <div className="flex flex-col gap-3">
            {tournamentMatches.length === 0 ? (
              <p className="text-slate-500 text-sm">Schedule will be published once registration closes.</p>
            ) : (
              tournamentMatches.map((m) => <MatchRow key={m.id} match={m} />)
            )}
          </div>
        )}

        {tab === "Bracket" && <Bracket matches={tournamentMatches} />}

        {tab === "Leaderboard" && (
          tournamentTeams.length === 0 ? (
            <p className="text-slate-500 text-sm">Leaderboard will populate once matches begin.</p>
          ) : (
            <LeaderboardTable teams={tournamentTeams} />
          )
        )}
      </div>
    </div>
  );
}
