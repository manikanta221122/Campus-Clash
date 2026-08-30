import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Swords } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!email.trim()) errs.email = "College email is required";
    if (!collegeId.trim()) errs.collegeId = "College ID is required";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitError(""); setSubmitting(true);
    try { await signup({ name, email, collegeId, password }); navigate("/dashboard"); } catch (signupError) { setSubmitError(signupError.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto flex items-center justify-center bg-gradient-to-br from-volt-500 to-cyan-500 shadow-glow-volt mb-4" style={{ clipPath: "polygon(20% 0,100% 0,80% 100%,0 100%)" }}>
          <Swords size={22} className="text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Create Your Account</h1>
        <p className="text-slate-500 text-sm mt-1">Join Campus Clash and start competing.</p>
      </div>

      <form onSubmit={handleSubmit} className="panel p-6 flex flex-col gap-4">
        <div>
          <label className="label-field">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Your full name" />
          {errors.name && <p className="text-live-400 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="label-field">College Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="input-field" placeholder="you@kluniversity.in" />
          {errors.email && <p className="text-live-400 text-xs mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="label-field">College ID</label>
          <input value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="input-field" placeholder="e.g. 2300031045" />
          {errors.collegeId && <p className="text-live-400 text-xs mt-1">{errors.collegeId}</p>}
        </div>
        <div>
          <label className="label-field">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="input-field" placeholder="••••••••" />
          {errors.password && <p className="text-live-400 text-xs mt-1">{errors.password}</p>}
        </div>
        {submitError && <p className="text-live-400 text-xs">{submitError}</p>}
        <button disabled={submitting} type="submit" className="btn-primary flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
          <UserPlus size={16} /> {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account? <Link to="/login" className="text-cyan-400 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
