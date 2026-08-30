import { Circle } from "lucide-react";

const STATUS_MAP = {
  open: { label: "Registration Open", classes: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" },
  starting_soon: { label: "Starting Soon", classes: "bg-gold-500/15 text-gold-400 border border-gold-500/30" },
  coming_soon: { label: "Coming Soon", classes: "bg-white/10 text-slate-300 border border-white/15" },
  completed: { label: "Completed", classes: "bg-white/5 text-slate-400 border border-white/10" },
  closed: { label: "Registration Closed", classes: "bg-live-500/15 text-live-400 border border-live-500/30" },
  live: { label: "Live", classes: "bg-live-500/15 text-live-400 border border-live-500/30" },
  upcoming: { label: "Upcoming", classes: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" },
};

export default function StatusBadge({ status }) {
  const conf = STATUS_MAP[status] || STATUS_MAP.open;
  const isLive = status === "live";
  return (
    <span className={`badge inline-flex items-center gap-1.5 ${conf.classes}`}>
      {isLive && <Circle size={7} className="fill-live-500 text-live-500 animate-pulse-live" />}
      {conf.label}
    </span>
  );
}
