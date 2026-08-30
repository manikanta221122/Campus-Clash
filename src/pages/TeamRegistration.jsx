import { useState } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { CheckCircle2, UserPlus, ShieldAlert } from "lucide-react";
import { useData } from "../context/DataContext";
import { modeLabel } from "../data/gameMeta";

const emptyPlayer = () => ({ name: "", collegeId: "", gameUid: "", ign: "" });

export default function TeamRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tournaments, registerTeam } = useData();
  const tournament = tournaments.find((t) => t.id === id);

  const [teamName, setTeamName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [captainId, setCaptainId] = useState("");
  const [players, setPlayers] = useState(() => Array.from({ length: tournament?.teamSize || 4 }, emptyPlayer));
  const [subEnabled, setSubEnabled] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [sub, setSub] = useState(emptyPlayer());
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  if (!tournament) return <Navigate to="/tournaments" replace />;

  const updatePlayer = (idx, field, value) => {
    setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const validate = () => {
    const errs = {};
    if (!teamName.trim()) errs.teamName = "Team name is required";
    if (!captainName.trim()) errs.captainName = "Captain name is required";
    if (!captainId.trim()) errs.captainId = "Captain college ID is required";
    if (!acceptedTerms) errs.terms = "You must accept the event rules and payment policy to register.";
    players.forEach((p, i) => {
      if (!p.name.trim() || !p.collegeId.trim() || !p.gameUid.trim() || !p.ign.trim()) {
        errs[`player${i}`] = "All fields are required for every player";
      }
    });
    if (subEnabled) {
      const anyFilled = sub.name || sub.collegeId || sub.gameUid || sub.ign;
      const allFilled = sub.name && sub.collegeId && sub.gameUid && sub.ign;
      if (anyFilled && !allFilled) errs.sub = "Fill in all substitute fields, or leave them blank";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    let team;
    try { team = await registerTeam(id, {
      teamName,
      captainName,
      captainId,
      players: [...players, ...(subEnabled && sub.name ? [{ ...sub, substitute: true }] : [])],
    }); } catch (registrationError) { setErrors((current) => ({ ...current, form: registrationError.message })); return; }
    if (Number(tournament.entryFee) > 0) {
      navigate(`/tournaments/${id}/payment?team=${team.id}`);
      return;
    }
    setSuccess(team);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={30} className="text-cyan-400" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white mb-2">Team Registered Successfully</h1>
        <p className="text-slate-400 mb-1">Your squad "{success.name}" is locked in for</p>
        <p className="text-slate-300 font-hud mb-6">{tournament.name}</p>
        <div className="panel p-4 inline-block mb-8">
          <p className="hud-label mb-1">Team ID</p>
          <p className="font-display font-bold text-cyan-300 text-lg tracking-widest">{success.id.toUpperCase()}</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to={`/tournaments/${id}`} className="btn-outline">Back to Tournament</Link>
          <Link to="/schedule" className="btn-primary">View Schedule</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <p className="hud-label mb-2">Team Registration</p>
      <h1 className="font-display text-3xl font-bold text-white mb-1">{tournament.name}</h1>
      <p className="text-slate-500 mb-8">Register your {tournament.teamSize === 1 ? "solo entry" : `${tournament.teamSize}-player squad`} for {modeLabel(tournament.game, tournament.mode)}. All fields marked are required.{Number(tournament.entryFee) > 0 ? ` A ₹${tournament.entryFee} UPI payment claim is required after this form and must be approved by an admin.` : ""}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="panel p-5 border-amber-400/25 bg-amber-400/[0.03]">
          <div className="flex gap-3"><ShieldAlert size={20} className="text-amber-300 shrink-0 mt-0.5" /><div><p className="font-hud font-semibold text-white">Read before registering</p><ul className="text-sm text-slate-400 mt-3 space-y-2 list-disc pl-4"><li>Only verified college students using their registered game accounts may compete.</li><li>Only the published 1st, 2nd, and 3rd placements receive prize money; other teams do not receive a payout.</li><li>{Number(tournament.entryFee) > 0 ? `Your ₹${tournament.entryFee} entry is confirmed only after admin payment verification. Do not send your UPI PIN or OTP to anyone.` : "This is a free entry event; no payment is required."}</li><li>Cheating, impersonation, or false payment claims can lead to disqualification. Read the tournament rules before continuing.</li></ul></div></div>
          <label className="flex items-start gap-3 mt-5 cursor-pointer text-sm text-slate-300"><input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="accent-cyan-500 mt-1" /><span>I confirm that my team is eligible, accept the rules and published prize policy, and understand that registration may be rejected for invalid information.</span></label>
          {errors.terms && <p className="text-live-400 text-xs mt-3">{errors.terms}</p>}
        </div>
        <div className="panel p-5">
          <h3 className="font-hud font-semibold text-white mb-4 flex items-center gap-2"><UserPlus size={16} className="text-cyan-400" /> Team Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Team Name</label>
              <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input-field" placeholder="e.g. Team Alpha" />
              {errors.teamName && <p className="text-live-400 text-xs mt-1">{errors.teamName}</p>}
            </div>
            <div>
              <label className="label-field">Captain Name</label>
              <input value={captainName} onChange={(e) => setCaptainName(e.target.value)} className="input-field" placeholder="Full name" />
              {errors.captainName && <p className="text-live-400 text-xs mt-1">{errors.captainName}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label-field">Captain College ID</label>
              <input value={captainId} onChange={(e) => setCaptainId(e.target.value)} className="input-field" placeholder="e.g. 2300031045" />
              {errors.captainId && <p className="text-live-400 text-xs mt-1">{errors.captainId}</p>}
            </div>
          </div>
        </div>

        {players.map((p, i) => (
          <div className="panel p-5" key={i}>
            <h3 className="font-hud font-semibold text-white mb-4">Player {i + 1}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Name</label>
                <input value={p.name} onChange={(e) => updatePlayer(i, "name", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">College ID</label>
                <input value={p.collegeId} onChange={(e) => updatePlayer(i, "collegeId", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">Game UID</label>
                <input value={p.gameUid} onChange={(e) => updatePlayer(i, "gameUid", e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="label-field">In-Game Name</label>
                <input value={p.ign} onChange={(e) => updatePlayer(i, "ign", e.target.value)} className="input-field" />
              </div>
            </div>
            {errors[`player${i}`] && <p className="text-live-400 text-xs mt-2">{errors[`player${i}`]}</p>}
          </div>
        ))}

        <div className="panel p-5">
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={subEnabled} onChange={(e) => setSubEnabled(e.target.checked)} className="accent-cyan-500" />
            <span className="font-hud font-semibold text-white">Add Substitute Player (optional)</span>
          </label>
          {subEnabled && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Name</label>
                <input value={sub.name} onChange={(e) => setSub({ ...sub, name: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">College ID</label>
                <input value={sub.collegeId} onChange={(e) => setSub({ ...sub, collegeId: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">Game UID</label>
                <input value={sub.gameUid} onChange={(e) => setSub({ ...sub, gameUid: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="label-field">In-Game Name</label>
                <input value={sub.ign} onChange={(e) => setSub({ ...sub, ign: e.target.value })} className="input-field" />
              </div>
              {errors.sub && <p className="text-live-400 text-xs sm:col-span-2">{errors.sub}</p>}
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary w-full py-4">{Number(tournament.entryFee) > 0 ? `Continue to ₹${tournament.entryFee} payment` : "Register Team"}</button>
        {errors.form && <p className="text-live-400 text-sm text-center">{errors.form}</p>}
      </form>
    </div>
  );
}
