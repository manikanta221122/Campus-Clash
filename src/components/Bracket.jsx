const ROUND_ORDER = ["Round 1", "Round 2", "Quarter Final", "Semi Final", "Grand Final"];

export default function Bracket({ matches }) {
  const rounds = ROUND_ORDER.filter((r) => matches.some((m) => m.round === r));
  if (rounds.length === 0) {
    return <p className="text-slate-500 text-sm">Bracket will be generated once the tournament begins.</p>;
  }

  return (
    <div className="overflow-x-auto no-scrollbar pb-4">
      <div className="flex gap-8 min-w-max px-1">
        {rounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round);
          return (
            <div key={round} className="flex flex-col justify-around gap-6 w-56 shrink-0">
              <p className="hud-label text-center text-volt-400 mb-1">{round}</p>
              {roundMatches.map((m) => {
                const done = m.status === "completed";
                const aWins = done && m.scoreA > m.scoreB;
                const bWins = done && m.scoreB > m.scoreA;
                return (
                  <div key={m.id} className={`panel p-0 overflow-hidden ${m.status === "live" ? "border-live-500/50" : ""}`}>
                    <div className={`flex items-center justify-between px-3 py-2 text-sm font-hud ${aWins ? "text-cyan-300 bg-cyan-500/10" : "text-slate-300"}`}>
                      <span className="truncate">{m.teamA}</span>
                      <span className="font-bold">{m.scoreA ?? "-"}</span>
                    </div>
                    <div className="h-px bg-white/10" />
                    <div className={`flex items-center justify-between px-3 py-2 text-sm font-hud ${bWins ? "text-cyan-300 bg-cyan-500/10" : "text-slate-300"}`}>
                      <span className="truncate">{m.teamB}</span>
                      <span className="font-bold">{m.scoreB ?? "-"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
