import { Trophy } from "lucide-react";

const RANK_STYLES = {
  1: "text-gold-400 border-gold-500/40 bg-gold-500/5",
  2: "text-slate-200 border-slate-400/30 bg-white/5",
  3: "text-orange-300 border-orange-500/30 bg-orange-500/5",
};

export default function LeaderboardTable({ teams }) {
  const sorted = [...teams].sort((a, b) => b.points - a.points);
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="hud-label px-4 py-3 w-16">Rank</th>
              <th className="hud-label px-4 py-3">Team</th>
              <th className="hud-label px-4 py-3 text-center">Matches</th>
              <th className="hud-label px-4 py-3 text-center">Wins</th>
              <th className="hud-label px-4 py-3 text-center">Kills</th>
              <th className="hud-label px-4 py-3 text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => {
              const rank = i + 1;
              const top = RANK_STYLES[rank];
              return (
                <tr key={team.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${top ? top.split(" ").slice(1).join(" ") : ""}`}>
                  <td className="px-4 py-3">
                    <span className={`font-display font-bold text-base ${top ? top.split(" ")[0] : "text-slate-400"}`}>
                      {rank <= 3 ? <Trophy size={14} className="inline mr-1 -mt-0.5" /> : null}
                      {rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{team.logo}</span>
                      <div>
                        <p className="font-hud font-semibold text-white text-sm">{team.name}</p>
                        <p className="text-xs text-slate-500">{team.college}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-300 font-hud">{team.matches}</td>
                  <td className="px-4 py-3 text-center text-slate-300 font-hud">{team.wins}</td>
                  <td className="px-4 py-3 text-center text-slate-300 font-hud">{team.kills}</td>
                  <td className="px-4 py-3 text-right font-hud font-bold text-white">{team.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
