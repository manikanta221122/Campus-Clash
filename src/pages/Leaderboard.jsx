import { useState } from "react";
import { useData } from "../context/DataContext";
import LeaderboardTable from "../components/LeaderboardTable";

export default function Leaderboard() {
  const { tournaments, teams } = useData();
  const [tournamentId, setTournamentId] = useState("all");

  const shownTeams = tournamentId === "all" ? teams : teams.filter((t) => t.tournamentIds?.includes(tournamentId));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="hud-label mb-2">Standings</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Leaderboard</h1>

      <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="input-field w-auto text-xs py-2 mb-6">
        <option value="all">All Tournaments (Combined)</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {shownTeams.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="text-slate-400">No teams to display yet.</p>
        </div>
      ) : (
        <LeaderboardTable teams={shownTeams} />
      )}
    </div>
  );
}
