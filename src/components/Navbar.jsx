import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Bell, ChevronDown, LogOut, Swords, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/schedule", label: "Schedule" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setOpen(false);
    navigate("/");
  };

  const dashboardPath = isAdmin ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-2xl" style={{ background: "linear-gradient(180deg, rgba(10,12,20,0.82) 0%, rgba(10,12,20,0.62) 100%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", backdropFilter: "blur(20px) saturate(160%)", boxShadow: "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
            <Swords size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-wide text-white">
            CAMPUS<span className="text-gradient">CLASH</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} className={({ isActive }) => `font-hud text-sm uppercase tracking-wide transition-colors ${isActive ? "text-cyan-400" : "text-slate-300 hover:text-white"}`}>
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `font-hud text-sm uppercase tracking-wide transition-colors flex items-center gap-1.5 ${isActive ? "text-volt-400" : "text-slate-300 hover:text-white"}`}>
              <Shield size={14} /> Admin
            </NavLink>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login" className="btn-ghost">Login</Link>
              <Link to="/signup" className="btn-primary text-xs px-5 py-2.5">Join Now</Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/notifications" className="relative p-2 text-slate-300 hover:text-cyan-400 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-live-500" />
              </Link>
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 px-3 py-2 rounded-full glass hover:bg-white/10 transition-colors border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-volt-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-glow-volt">
                    {user.name.charAt(0)}
                  </div>
                  <span className="font-hud text-sm text-slate-200 max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-52 glass-strong rounded-xl p-2 flex flex-col gap-1 overflow-hidden">
                    <Link onClick={() => setMenuOpen(false)} to={dashboardPath} className="px-3 py-2 text-sm text-slate-200 hover:bg-white/5 rounded-sm">{isAdmin ? "Admin Dashboard" : "My Dashboard"}</Link>
                    <Link onClick={() => setMenuOpen(false)} to="/profile" className="px-3 py-2 text-sm text-slate-200 hover:bg-white/5 rounded-sm">Profile</Link>
                    <Link onClick={() => setMenuOpen(false)} to="/notifications" className="px-3 py-2 text-sm text-slate-200 hover:bg-white/5 rounded-sm">Notifications</Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-live-400 hover:bg-live-500/10 rounded-sm text-left"><LogOut size={14} /> Log Out</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <button className="lg:hidden text-slate-200" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-3" style={{ background: "rgba(10,12,20,0.92)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)" }}>
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `font-hud text-sm uppercase tracking-wide py-1.5 ${isActive ? "text-cyan-400" : "text-slate-300"}`}>
              {l.label}
            </NavLink>
          ))}
          {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="font-hud text-sm uppercase tracking-wide text-volt-400 py-1.5 flex items-center gap-2"><Shield size={14} /> Admin Panel</Link>}
          <div className="h-px bg-white/10 my-1" />
          {!user ? (
            <>
              <Link to="/login" onClick={() => setOpen(false)} className="btn-outline text-center">Login</Link>
              <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary text-center">Join Now</Link>
            </>
          ) : (
            <>
              <Link to={dashboardPath} onClick={() => setOpen(false)} className="font-hud text-sm text-slate-300 py-1.5">{isAdmin ? "Admin Dashboard" : "My Dashboard"}</Link>
              <Link to="/profile" onClick={() => setOpen(false)} className="font-hud text-sm text-slate-300 py-1.5">Profile</Link>
              <Link to="/notifications" onClick={() => setOpen(false)} className="font-hud text-sm text-slate-300 py-1.5">Notifications</Link>
              <button onClick={handleLogout} className="font-hud text-sm text-live-400 py-1.5 text-left">Log Out</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
