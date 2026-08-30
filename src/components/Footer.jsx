import { Link } from "react-router-dom";
import { Swords, Camera, Tv, Play } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-24 backdrop-blur-xl" style={{ background: "linear-gradient(180deg, rgba(10,12,20,0.72) 0%, rgba(6,7,11,0.92) 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
              <Swords size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">CAMPUS CLASH</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">The official esports tournament platform for KL University.</p>
          <div className="flex gap-3 mt-4 text-slate-500">
            <Camera size={16} className="hover:text-cyan-400 cursor-pointer transition-colors" />
            <Tv size={16} className="hover:text-cyan-400 cursor-pointer transition-colors" />
            <Play size={16} className="hover:text-cyan-400 cursor-pointer transition-colors" />
          </div>
        </div>
        <div>
          <p className="hud-label mb-3">Platform</p>
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <Link to="/tournaments" className="hover:text-cyan-400 transition-colors">Tournaments</Link>
            <Link to="/leaderboard" className="hover:text-cyan-400 transition-colors">Leaderboard</Link>
            <Link to="/schedule" className="hover:text-cyan-400 transition-colors">Schedule</Link>
          </div>
        </div>
        <div>
          <p className="hud-label mb-3">Account</p>
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <Link to="/login" className="hover:text-cyan-400 transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-cyan-400 transition-colors">Sign Up</Link>
            <Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Dashboard</Link>
          </div>
        </div>
        <div>
          <p className="hud-label mb-3">Games</p>
          <div className="flex flex-col gap-2 text-sm text-slate-400">
            <span>Free Fire</span>
            <span className="text-slate-600">BGMI · Soon</span>
            <span className="text-slate-600">Valorant · Soon</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-600 font-hud tracking-wide">
        © 2026 CAMPUS CLASH — BUILT FOR STUDENTS, BY STUDENTS.
      </div>
    </footer>
  );
}
