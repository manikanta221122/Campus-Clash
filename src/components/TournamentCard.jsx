import { Link } from "react-router-dom";
import { Users, Trophy, CalendarClock, ArrowUpRight } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { gameMeta, modeLabel } from "../data/gameMeta";

export default function TournamentCard({ tournament }) {
  const meta = gameMeta[tournament.game];
  const pctFilled = Math.min(100, Math.round((tournament.registeredTeams / tournament.maxTeams) * 100));

  return (
    <div className="panel group flex flex-col p-5 hover:border-white/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_30px_rgba(124,92,255,0.18)] transition-all duration-300 hover:-translate-y-1.5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/10 backdrop-blur"
            style={{ background: `${meta.color}18`, boxShadow: `0 0 14px ${meta.color}30` }}
          >
            {meta.icon}
          </div>
          <div>
            <p className="hud-label text-slate-500">{meta.name}</p>
            <p className="font-hud text-sm text-slate-400">{tournament.host}</p>
          </div>
        </div>
        <StatusBadge status={tournament.status} />
      </div>

      <h3 className="font-display text-lg font-bold text-white leading-snug mb-1 group-hover:text-cyan-300 transition-colors">
        {tournament.name}
      </h3>
      <p className="hud-label text-slate-600 mb-4">{modeLabel(tournament.game, tournament.mode)} · {tournament.teamSize}p/team</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-gold-400" />
          <div>
            <p className="text-white font-hud font-semibold text-sm">₹{tournament.prizePool.toLocaleString("en-IN")}</p>
            <p className="hud-label text-[10px]">Prize Pool</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users size={15} className="text-cyan-400" />
          <div>
            <p className="text-white font-hud font-semibold text-sm">{tournament.registeredTeams}/{tournament.maxTeams}</p>
            <p className="hud-label text-[10px]">Teams</p>
          </div>
        </div>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-volt-500 to-cyan-500"
          style={{ width: `${pctFilled}%` }}
        />
      </div>

      <div className="flex items-center gap-2 mb-5 text-xs text-slate-400 font-hud">
        <CalendarClock size={14} />
        <span>Deadline {new Date(tournament.registrationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span className="text-slate-600">•</span>
        <span>Starts {new Date(tournament.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
      </div>

      <Link
        to={`/tournaments/${tournament.id}`}
        className="mt-auto flex items-center justify-center gap-1.5 font-hud font-semibold uppercase tracking-wide text-xs px-4 py-2.5 rounded-full glass text-slate-200 hover:border-cyan-400/40 hover:text-cyan-200 hover:bg-white/[0.07] transition-all"
      >
        View Tournament <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
