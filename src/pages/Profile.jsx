import { Navigate, Link } from "react-router-dom";
import { ShieldCheck, Trophy, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const ACHIEVEMENTS = [
  { icon: "🏆", label: "Tournament Winner" },
  { icon: "🥇", label: "Top Fragger" },
  { icon: "🔥", label: "10 Match Win Streak" },
];

export default function Profile() {
  const { user } = useAuth();
  const { teams, matches } = useData();
  if (!user) return <Navigate to="/login" replace />;

  const myTeam = teams.find((t) => t.captainUserId === user.id);
  const played = myTeam ? matches.filter((m) => m.teamA === myTeam.name || m.teamB === myTeam.name) : [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="panel p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-volt-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-glow-volt">
          {user.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold text-white">{user.name}</h1>
            {user.verified && (
              <span className="badge flex items-center gap-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                <ShieldCheck size={12} /> Verified College Student
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-1">{user.email}</p>
          <p className="text-slate-500 text-sm">KL University • ID {user.collegeId}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="panel p-5">
          <Swords size={18} className="text-cyan-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{myTeam ? myTeam.name : "—"}</p>
          <p className="hud-label text-[10px] mt-1">Team</p>
        </div>
        <div className="panel p-5">
          <Trophy size={18} className="text-gold-400 mb-2" />
          <p className="font-hud font-bold text-white text-lg">{myTeam?.wins ?? 0}</p>
          <p className="hud-label text-[10px] mt-1">Wins</p>
        </div>
        <div className="panel p-5">
          <p className="font-hud font-bold text-white text-lg">{played.length}</p>
          <p className="hud-label text-[10px] mt-1">Matches Played</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-hud font-semibold text-white mb-3">Tournament History</h3>
          {played.length === 0 ? (
            <div className="panel p-6 text-center text-slate-500 text-sm">No matches played yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {played.map((m) => (
                <div key={m.id} className="panel p-3 flex justify-between text-sm">
                  <span className="text-slate-300 font-hud">{m.teamA} vs {m.teamB}</span>
                  <span className="text-slate-500">{m.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="font-hud font-semibold text-white mb-3">Achievements</h3>
          <div className="flex flex-col gap-2">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label} className="panel p-3 flex items-center gap-3">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm text-slate-300 font-hud">{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Link to="/dashboard" className="btn-outline inline-block">Back to Dashboard</Link>
      </div>
    </div>
  );
}
