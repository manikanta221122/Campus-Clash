import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = (user) => navigate(user.role === "admin" ? "/admin" : "/dashboard");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try { destination(await login(email, password)); } catch (loginError) { setError(loginError.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14 md:py-20">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-5" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
          <Swords size={25} className="text-white" />
        </div>
        <p className="hud-label text-cyan-400 mb-2">Campus Clash Access</p>
        <h1 className="font-display text-3xl font-bold text-white">Enter the Arena</h1>
        <p className="text-slate-500 text-sm mt-2">Sign in to manage your squad, matches and tournament journey.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6 md:p-7 flex flex-col gap-4">
        <div>
          <label className="label-field">College Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="you@kluniversity.in" />
        </div>
        <div>
          <label className="label-field">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="••••••••" />
        </div>
        {error && <p className="text-live-400 text-xs">{error}</p>}
        <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60"><LogIn size={16} /> {submitting ? "Logging in..." : "Log In"}</button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account? <Link to="/signup" className="text-cyan-400 hover:underline">Sign up as a player</Link>
      </p>
      <p className="text-center text-[11px] text-slate-600 mt-3">Accounts and roles are verified by the Campus Clash server.</p>
    </div>
  );
}
