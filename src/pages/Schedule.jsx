import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import MatchRow from "../components/MatchRow";

export default function Schedule() {
  const { tournaments, matches } = useData();
  const [tournamentId, setTournamentId] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const matchesT = tournamentId === "all" || m.tournamentId === tournamentId;
      const matchesS = status === "all" || m.status === status;
      return matchesT && matchesS;
    });
  }, [matches, tournamentId, status]);

  const grouped = filtered.reduce((acc, m) => {
    acc[m.round] = acc[m.round] || [];
    acc[m.round].push(m);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <p className="hud-label mb-2">Fixtures</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Tournament Schedule</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="input-field w-auto text-xs py-2">
          <option value="all">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto text-xs py-2">
          <option value="all">All Statuses</option>
          <option value="live">Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="font-display text-lg text-white mb-2">No matches found</p>
          <p className="text-slate-500 text-sm">Try a different filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(grouped).map(([round, list]) => (
            <div key={round}>
              <h3 className="font-hud font-semibold uppercase tracking-widest text-volt-400 text-sm mb-3">{round}</h3>
              <div className="flex flex-col gap-3">
                {list.map((m) => <MatchRow key={m.id} match={m} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
