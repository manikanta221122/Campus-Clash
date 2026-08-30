import { Link } from "react-router-dom";
import { Circle, Clock, KeyRound } from "lucide-react";

export default function MatchRow({ match }) {
  const isLive = match.status === "live";
  const isDone = match.status === "completed";

  return (
    <div className={`panel p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap ${isLive ? "border-live-500/40 shadow-glow-live" : ""}`}>
      <div className="flex flex-col items-start w-28 shrink-0">
        <span className="hud-label text-volt-400">{match.round}</span>
        <span className="text-xs text-slate-500 font-hud">Match #{match.matchNumber}</span>
      </div>

      <div className="flex items-center gap-3 flex-1 min-w-[200px] justify-center">
        <span className={`font-hud font-semibold text-sm ${isDone && match.scoreA > match.scoreB ? "text-cyan-300" : "text-slate-200"} truncate max-w-[110px] sm:max-w-none`}>{match.teamA}</span>
        <div className="flex items-center gap-2 px-3 py-1 bg-void-900 border border-white/10 shrink-0">
          {isDone ? (
            <span className="font-display font-bold text-sm text-white">{match.scoreA} - {match.scoreB}</span>
          ) : (
            <span className="font-hud text-xs text-slate-500">VS</span>
          )}
        </div>
        <span className={`font-hud font-semibold text-sm ${isDone && match.scoreB > match.scoreA ? "text-cyan-300" : "text-slate-200"} truncate max-w-[110px] sm:max-w-none`}>{match.teamB}</span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-hud shrink-0">
        <Clock size={12} />
        {match.time}
      </div>

      <div className="shrink-0">
        {isLive ? (
          <Link to={`/match/${match.id}`} className="badge flex items-center gap-1.5 bg-live-500/15 text-live-400 border border-live-500/30 hover:bg-live-500/25 transition-colors">
            <Circle size={7} className="fill-live-500 text-live-500 animate-pulse-live" /> Watch Live
          </Link>
        ) : isDone ? (
          <span className="badge bg-white/5 text-slate-400 border border-white/10">Completed</span>
        ) : match.roomId ? (
          <Link to={`/match/${match.id}`} className="badge flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/20 transition-colors">
            <KeyRound size={11} /> Room Out
          </Link>
        ) : (
          <span className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">Upcoming</span>
        )}
      </div>
    </div>
  );
}
