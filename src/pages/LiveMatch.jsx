import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { Circle, Timer, Swords, ShieldCheck, KeyRound } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

export default function LiveMatch() {
  const { id } = useParams();
  const { matches, tournaments, updateMatchResult } = useData();
  const { user } = useAuth();
  const match = matches.find((m) => m.id === id);

  const [elapsed, setElapsed] = useState(0);
  const [liveScoreA, setLiveScoreA] = useState(match?.scoreA ?? 0);
  const [liveScoreB, setLiveScoreB] = useState(match?.scoreB ?? 0);
  const [killsA, setKillsA] = useState(match?.killsA ?? 0);
  const [killsB, setKillsB] = useState(match?.killsB ?? 0);
  const [status, setStatus] = useState(match?.status ?? "upcoming");
  const [roomId, setRoomId] = useState(match?.roomId ?? "");
  const [roomPassword, setRoomPassword] = useState(match?.roomPassword ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!match) return;
    setLiveScoreA(match.scoreA ?? 0);
    setLiveScoreB(match.scoreB ?? 0);
    setKillsA(match.killsA ?? 0);
    setKillsB(match.killsB ?? 0);
    setStatus(match.status ?? "upcoming");
    setRoomId(match.roomId ?? "");
    setRoomPassword(match.roomPassword ?? "");
  }, [match]);

  useEffect(() => {
    if (match?.status !== "live") return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [match]);

  if (!match) return <Navigate to="/schedule" replace />;

  const tournament = tournaments.find((t) => t.id === match.tournamentId);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");
  const isAdmin = user?.role === "admin";
  const isLive = match.status === "live";

  const saveScore = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateMatchResult(match.id, { scoreA: liveScoreA, scoreB: liveScoreB, killsA, killsB, status, roomId, roomPassword });
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Link to={`/tournaments/${match.tournamentId}`} className="hud-label text-slate-500 hover:text-cyan-400 transition-colors mb-6 inline-block">← {tournament?.name}</Link>
      <div className="panel p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          {isLive ? <span className="badge flex items-center gap-1.5 bg-live-500/15 text-live-400 border border-live-500/30"><Circle size={7} className="fill-live-500 text-live-500 animate-pulse-live" /> Live</span> : <span className="badge bg-white/5 text-slate-400 border border-white/10">{match.status === "completed" ? "Completed" : "Upcoming"}</span>}
          <div className="flex items-center gap-1.5 text-slate-400 font-hud text-sm"><Timer size={14} /> {isLive ? `${mins}:${secs}` : match.time}</div>
        </div>
        <p className="hud-label text-center mb-1">{tournament?.name}</p>
        <div className="flex items-center justify-center gap-6 md:gap-14 my-8">
          <div className="text-center flex-1"><p className="font-display font-bold text-lg md:text-2xl text-white truncate">{match.teamA}</p><p className="font-display font-black text-4xl md:text-6xl text-cyan-300 mt-2">{match.scoreA ?? "-"}</p></div>
          <Swords size={22} className="text-slate-600 shrink-0" />
          <div className="text-center flex-1"><p className="font-display font-bold text-lg md:text-2xl text-white truncate">{match.teamB}</p><p className="font-display font-black text-4xl md:text-6xl text-live-400 mt-2">{match.scoreB ?? "-"}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-2">
          <div className="panel p-3 text-center"><p className="font-hud font-bold text-white">{(match.killsA ?? 0) + (match.killsB ?? 0)}</p><p className="hud-label text-[10px] mt-1">Total Kills</p></div>
          <div className="panel p-3 text-center"><p className="font-hud font-bold text-white">#{match.matchNumber}</p><p className="hud-label text-[10px] mt-1">Match No.</p></div>
          <div className="panel p-3 text-center"><p className="font-hud font-bold text-white">{match.round}</p><p className="hud-label text-[10px] mt-1">Stage</p></div>
        </div>
      </div>

      {match.roomId ? (
        <div className="panel p-5 mt-8 border-cyan-500/30 bg-cyan-500/5">
          <div className="flex items-center gap-2 mb-4"><KeyRound size={16} className="text-cyan-400" /><p className="font-hud font-semibold text-white">Room Details</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><p className="hud-label text-[10px] mb-1">Room ID</p><p className="font-display font-bold text-xl text-cyan-300 tracking-widest">{match.roomId}</p></div>
            {match.roomPassword && <div><p className="hud-label text-[10px] mb-1">Password</p><p className="font-display font-bold text-xl text-cyan-300 tracking-widest">{match.roomPassword}</p></div>}
          </div>
          <p className="text-xs text-slate-500 mt-3">Join the custom room in-game with the details above. Only teams registered for this match should join.</p>
        </div>
      ) : match.status !== "completed" && (
        <div className="panel p-4 mt-8 text-center text-slate-500 text-sm">Room ID & password haven't been announced yet — check back closer to the match time.</div>
      )}

      <div className="grid sm:grid-cols-2 gap-5 mt-8">
        <div className="panel p-5"><p className="hud-label mb-3">{match.teamA} — Kills</p><p className="font-display font-bold text-3xl text-white">{match.killsA ?? 0}</p></div>
        <div className="panel p-5"><p className="hud-label mb-3">{match.teamB} — Kills</p><p className="font-display font-bold text-3xl text-white">{match.killsB ?? 0}</p></div>
      </div>

      {isAdmin && (
        <div className="panel p-5 mt-8 border-volt-500/30">
          <div className="flex items-center gap-2 mb-4"><ShieldCheck size={16} className="text-volt-400" /><p className="font-hud font-semibold text-white">Admin Controls — Update Score</p></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label-field">{match.teamA} Score</label><div className="flex items-center gap-2"><button onClick={() => setLiveScoreA((s) => Math.max(0, s - 1))} className="btn-outline px-3 py-2">-</button><input value={liveScoreA} readOnly className="input-field text-center" /><button onClick={() => setLiveScoreA((s) => s + 1)} className="btn-outline px-3 py-2">+</button></div></div>
            <div><label className="label-field">{match.teamB} Score</label><div className="flex items-center gap-2"><button onClick={() => setLiveScoreB((s) => Math.max(0, s - 1))} className="btn-outline px-3 py-2">-</button><input value={liveScoreB} readOnly className="input-field text-center" /><button onClick={() => setLiveScoreB((s) => s + 1)} className="btn-outline px-3 py-2">+</button></div></div>
            <div><label className="label-field">{match.teamA} Kills</label><input type="number" min="0" value={killsA} onChange={(e) => setKillsA(Number(e.target.value))} className="input-field" /></div>
            <div><label className="label-field">{match.teamB} Kills</label><input type="number" min="0" value={killsB} onChange={(e) => setKillsB(Number(e.target.value))} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="label-field">Match Status</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field"><option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div><label className="label-field flex items-center gap-1"><KeyRound size={12} /> Room ID</label><input value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-field" placeholder="Announce the custom room ID" /></div>
            <div><label className="label-field">Room Password</label><input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} className="input-field" placeholder="Optional" /></div>
          </div>
          <p className="text-xs text-slate-600 mt-3">Fill Room ID in whenever you're ready to announce it — players will see it above as soon as you save.</p>
          {saveError && <p className="text-live-400 text-sm mt-4">{saveError}</p>}
          <button onClick={saveScore} disabled={saving} className="btn-primary mt-5 disabled:opacity-50">{saving ? "Saving…" : "Save Score Update"}</button>
        </div>
      )}
    </div>
  );
}
