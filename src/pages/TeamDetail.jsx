import { useParams, Navigate, Link } from "react-router-dom";
import { Trophy, Target, Percent } from "lucide-react";
import { useData } from "../context/DataContext";

export default function TeamDetail() {
  const { id } = useParams();
  const { teams, tournaments, matches } = useData();
  const team = teams.find((t) => t.id === id);
  if (!team) return <Navigate to="/tournaments" replace />;

  const teamTournaments = tournaments.filter((t) => team.tournamentIds?.includes(t.id));
  const teamMatches = matches.filter((m) => m.teamAId === team.id || m.teamBId === team.id);
  const winRate = team.matches ? Math.round((team.wins / team.matches) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="panel p-6 md:p-8 flex items-center gap-5 mb-8">
        <span className="text-4xl">{team.logo}</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{team.name}</h1>
          <p className="text-slate-500 text-sm">{team.college} • Captain: {team.captain}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="panel p-5">
          <Trophy size={18} className="text-gold-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{team.wins}/{team.matches}</p>
          <p className="hud-label text-[10px] mt-1">Wins</p>
        </div>
        <div className="panel p-5">
          <Target size={18} className="text-cyan-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{team.kills}</p>
          <p className="hud-label text-[10px] mt-1">Total Kills</p>
        </div>
        <div className="panel p-5">
          <Percent size={18} className="text-volt-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{winRate}%</p>
          <p className="hud-label text-[10px] mt-1">Win Rate</p>
        </div>
      </div>

      {team.players && (
        <div className="mb-10">
          <h3 className="font-hud font-semibold text-white mb-3">Roster</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {team.players.map((p, i) => (
              <div key={i} className="panel p-4">
                <p className="font-hud font-semibold text-white text-sm">{p.name} {p.substitute && <span className="text-slate-500 text-xs">(Sub)</span>}</p>
                <p className="text-xs text-slate-500 mt-1">IGN: {p.ign} • UID: {p.gameUid}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-10">
        <h3 className="font-hud font-semibold text-white mb-3">Tournaments</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {teamTournaments.map((t) => (
            <Link key={t.id} to={`/tournaments/${t.id}`} className="panel p-4 hover:border-cyan-500/40 transition-colors">
              <p className="font-hud font-semibold text-white text-sm">{t.name}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-hud font-semibold text-white mb-3">Match History</h3>
        <div className="flex flex-col gap-2">
          {teamMatches.map((m) => (
            <div key={m.id} className="panel p-3 flex justify-between text-sm">
              <span className="text-slate-300 font-hud">{m.teamA} vs {m.teamB}</span>
              <span className="text-slate-500">{m.status === "completed" ? `${m.scoreA} - ${m.scoreB}` : m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
