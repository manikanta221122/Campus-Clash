import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useData } from "../context/DataContext";
import TournamentCard from "../components/TournamentCard";
import { gameMeta } from "../data/gameMeta";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Registration Open" },
  { id: "starting_soon", label: "Starting Soon" },
  { id: "completed", label: "Completed" },
  { id: "coming_soon", label: "Coming Soon" },
];

const SORTS = [
  { id: "date", label: "Start Date" },
  { id: "prize", label: "Prize Pool (High to Low)" },
  { id: "teams", label: "Most Teams" },
];

export default function Tournaments() {
  const { tournaments } = useData();
  const [query, setQuery] = useState("");
  const [game, setGame] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("date");

  const filtered = useMemo(() => {
    let list = tournaments.filter((t) => {
      const matchesQuery = t.name.toLowerCase().includes(query.toLowerCase());
      const matchesGame = game === "all" || t.game === game;
      const matchesStatus = status === "all" || t.status === status;
      return matchesQuery && matchesGame && matchesStatus;
    });
    if (sort === "prize") list = [...list].sort((a, b) => b.prizePool - a.prizePool);
    if (sort === "teams") list = [...list].sort((a, b) => b.registeredTeams - a.registeredTeams);
    if (sort === "date") list = [...list].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    return list;
  }, [tournaments, query, game, status, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p className="hud-label mb-2">Discover</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white">All Tournaments</h1>
        <p className="text-slate-500 mt-2">Search, filter and register for tournaments happening across campus.</p>
      </div>

      <div className="panel p-4 md:p-5 mb-8 flex flex-col gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tournaments…"
            className="input-field pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 mr-1">
            <SlidersHorizontal size={14} />
            <span className="hud-label">Filter</span>
          </div>
          <select value={game} onChange={(e) => setGame(e.target.value)} className="input-field w-auto text-xs py-2">
            <option value="all">All Games</option>
            {Object.entries(gameMeta).map(([id, m]) => (
              <option key={id} value={id}>{m.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field w-auto text-xs py-2">
            {STATUS_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field w-auto text-xs py-2 ml-auto">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>Sort: {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-12 text-center">
          <p className="font-display text-lg text-white mb-2">No tournaments found</p>
          <p className="text-slate-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
