import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Trophy, Radio, Shield, Check, X, Ban, PlusCircle, CheckCircle2, Gamepad2, ArrowUpRight, Settings2, Swords, CalendarClock, KeyRound } from "lucide-react";
import { useData } from "../context/DataContext";
import { users } from "../data/users";
import { gameMeta, modesForGame } from "../data/gameMeta";
import { useAuth } from "../context/AuthContext";

const emptyForm = { name: "", game: "freefire", mode: modesForGame("freefire")[0].id, description: "", prizePool: "", firstPrize: "", secondPrize: "", thirdPrize: "", entryFee: "0", maxTeams: "16", registrationDeadline: "", startDate: "", rules: "" };
const ROUND_OPTIONS = ["Round 1", "Round 2", "Quarter Final", "Semi Final", "Grand Final"];
const emptyMatchForm = { tournamentId: "", round: "Round 1", matchNumber: "1", teamAId: "", teamALabel: "TBD", teamBId: "", teamBLabel: "TBD", scheduledAt: "", roomId: "", roomPassword: "" };

export default function AdminDashboard() {
  const { tournaments, teams, matches, payments, payouts, reviewPayment, recordPayout, createTournament, createMatch, updateMatchResult, setMatchTeam } = useData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("overview");
  const [payoutForm, setPayoutForm] = useState({ tournamentId: "", placement: "1st place", recipient: "", upiId: "", amount: "" });
  const [matchForm, setMatchForm] = useState(emptyMatchForm);
  const [matchFormError, setMatchFormError] = useState("");
  const [matchFilterId, setMatchFilterId] = useState("all");
  const [reports] = useState([
    { id: "r1", subject: "Dispute — Match #4 result", team: "Phoenix Squad vs Team Titans" },
    { id: "r2", subject: "Reported — suspected teaming", team: "Rogue Elites" },
  ]);

  const update = (key, value) => setForm((current) => (
    key === "game" ? { ...current, game: value, mode: modesForGame(value)[0].id } : { ...current, [key]: value }
  ));
  const updateMatchField = (key, value) => setMatchForm((current) => ({ ...current, [key]: value }));

  const eligibleTeams = useMemo(
    () => teams.filter((t) => t.tournamentIds?.includes(matchForm.tournamentId)),
    [teams, matchForm.tournamentId]
  );

  const submitMatch = async (e) => {
    e.preventDefault();
    setMatchFormError("");
    try {
      await createMatch(matchForm);
      setMatchForm({ ...emptyMatchForm, tournamentId: matchForm.tournamentId });
    } catch (error) {
      setMatchFormError(error.message);
    }
  };

  const filteredMatches = matchFilterId === "all" ? matches : matches.filter((m) => m.tournamentId === matchFilterId);

  const submit = async (e) => {
    e.preventDefault();
    if (user?.role !== "admin") return;
    try {
      const tournament = await createTournament(form, user);
      setCreated(tournament);
      setShowForm(false);
      setForm(emptyForm);
      setActiveTab("tournaments");
    } catch (error) {
      alert(error.message);
    }
  };

  const activeCount = tournaments.filter((t) => ["open", "starting_soon"].includes(t.status)).length;
  const approvedRevenue = payments.filter((payment) => payment.status === "approved").reduce((total, payment) => total + payment.amount, 0);
  const paidPrizes = payouts.reduce((total, payout) => total + payout.amount, 0);
  const stats = [
    { icon: Users, label: "Players", value: users.filter((u) => u.role === "player").length + 40, detail: "Verified campus accounts" },
    { icon: Trophy, label: "Tournaments", value: tournaments.length, detail: "Created by administration" },
    { icon: Radio, label: "Active", value: activeCount, detail: "Open or starting soon" },
    { icon: Shield, label: "Teams", value: teams.length, detail: "Registered squads" },
    { icon: Swords, label: "Matches", value: matches.length, detail: `${matches.filter((m) => m.status === "live").length} live now` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <section className="relative overflow-hidden panel p-6 md:p-8 mb-7">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-24 w-72 h-72 rounded-full bg-volt-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3"><span className="badge bg-volt-500/10 text-volt-300 border border-volt-500/25">ADMIN ONLY</span><span className="hud-label">Control center</span></div>
            <h1 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight">Run the <span className="text-gradient">Arena.</span></h1>
            <p className="text-slate-400 mt-3 max-w-2xl">Create and manage official Campus Clash tournaments, control match results, and keep the competition fair.</p>
          </div>
          <button onClick={() => { setShowForm((v) => !v); setActiveTab("overview"); }} className="btn-primary flex items-center justify-center gap-2 shrink-0"><PlusCircle size={17} /> {showForm ? "Close Creator" : "Create Tournament"}</button>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="panel p-5 group hover:border-cyan-500/25 transition-colors">
            <div className="flex items-center justify-between"><s.icon size={18} className="text-cyan-400" /><ArrowUpRight size={14} className="text-slate-700 group-hover:text-cyan-400 transition-colors" /></div>
            <p className="font-display font-black text-3xl text-white mt-4">{s.value}</p>
            <p className="font-hud text-sm font-semibold text-slate-200 mt-1">{s.label}</p>
            <p className="text-xs text-slate-600 mt-1">{s.detail}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b border-white/10 mb-7 overflow-x-auto no-scrollbar">
        {["overview", "tournaments", "matches", "payments", "reports", "users"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-hud text-xs uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? "text-cyan-300 border-cyan-400" : "text-slate-500 border-transparent hover:text-slate-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      {created && (
        <div className="panel p-4 mb-6 border-cyan-500/30 flex items-start gap-3 bg-cyan-500/5">
          <CheckCircle2 size={19} className="text-cyan-400 shrink-0 mt-0.5" />
          <div><p className="font-hud font-semibold text-white">Tournament published</p><p className="text-sm text-slate-400 mt-1">{created.name} is now open for student registration.</p></div>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="panel p-6 md:p-8 mb-8 border-cyan-500/20">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div><p className="hud-label text-cyan-400 mb-1">Official tournament creator</p><h2 className="font-display text-2xl font-bold text-white">Publish a new tournament</h2></div>
            <Settings2 size={20} className="text-slate-600" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><label className="label-field">Tournament Name</label><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input-field" placeholder="e.g. Free Fire Campus Championship" /></div>
            <div><label className="label-field">Game</label><select value={form.game} onChange={(e) => update("game", e.target.value)} className="input-field">{Object.entries(gameMeta).map(([id, meta]) => <option key={id} value={id}>{meta.name}</option>)}</select></div>
            <div><label className="label-field">Mode</label><select value={form.mode} onChange={(e) => update("mode", e.target.value)} className="input-field">{modesForGame(form.game).map((m) => <option key={m.id} value={m.id}>{m.name} — {m.teamSize} player{m.teamSize > 1 ? "s" : ""}/team</option>)}</select></div>
            <div className="sm:col-span-2"><label className="label-field">Description</label><textarea required value={form.description} onChange={(e) => update("description", e.target.value)} className="input-field min-h-[100px]" placeholder="Tell students what this tournament is about..." /></div>
            <div><label className="label-field">Prize Pool (₹)</label><input required min="0" type="number" value={form.prizePool} onChange={(e) => update("prizePool", e.target.value)} className="input-field" placeholder="10000" /></div>
            <div><label className="label-field">Entry Fee (₹)</label><input min="0" type="number" value={form.entryFee} onChange={(e) => update("entryFee", e.target.value)} className="input-field" placeholder="0" /></div>
            <div className="sm:col-span-2"><label className="label-field">Published prize split <span className="text-slate-600 normal-case tracking-normal">(must not exceed prize pool)</span></label><div className="grid grid-cols-3 gap-3"><input min="0" type="number" value={form.firstPrize} onChange={(e) => update("firstPrize", e.target.value)} className="input-field" placeholder="1st prize" /><input min="0" type="number" value={form.secondPrize} onChange={(e) => update("secondPrize", e.target.value)} className="input-field" placeholder="2nd prize" /><input min="0" type="number" value={form.thirdPrize} onChange={(e) => update("thirdPrize", e.target.value)} className="input-field" placeholder="3rd prize" /></div></div>
            <div><label className="label-field">Maximum Teams</label><input required min="2" type="number" value={form.maxTeams} onChange={(e) => update("maxTeams", e.target.value)} className="input-field" /></div>
            <div><label className="label-field">Registration Deadline</label><input required type="date" value={form.registrationDeadline} onChange={(e) => update("registrationDeadline", e.target.value)} className="input-field" /></div>
            <div><label className="label-field">Tournament Date</label><input required type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="input-field" /></div>
            <div className="sm:col-span-2"><label className="label-field">Rules <span className="text-slate-600 normal-case tracking-normal">(one rule per line)</span></label><textarea value={form.rules} onChange={(e) => update("rules", e.target.value)} className="input-field min-h-[130px]" placeholder={'Team must have 4 players\nAll players must be verified students\nNo cheating or third-party software'} /></div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button><button type="submit" className="btn-primary flex items-center gap-2"><Trophy size={15} /> Publish Tournament</button></div>
        </form>
      )}

      {activeTab === "overview" && !showForm && (
        <section className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 panel p-6">
            <div className="flex items-center justify-between mb-5"><div><p className="hud-label">Quick management</p><h2 className="font-display text-xl font-bold text-white mt-1">Latest tournaments</h2></div><button onClick={() => setActiveTab("tournaments")} className="btn-ghost">View all</button></div>
            <div className="space-y-3">
              {tournaments.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-4 p-4 bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="min-w-0"><p className="font-hud font-semibold text-white truncate">{t.name}</p><p className="text-xs text-slate-500 mt-1">{t.registeredTeams}/{t.maxTeams} teams · ₹{Number(t.prizePool).toLocaleString("en-IN")}</p></div>
                  <Link to={`/tournaments/${t.id}`} className="btn-outline text-[10px] px-3 py-2 shrink-0">View</Link>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <p className="hud-label">Admin principle</p>
            <h2 className="font-display text-xl font-bold text-white mt-1">One official source.</h2>
            <p className="text-sm text-slate-500 mt-3 leading-6">Students discover and join tournaments. Only the college administration publishes official tournaments and controls competition data.</p>
            <div className="mt-5 p-4 border border-volt-500/20 bg-volt-500/5"><p className="text-xs text-volt-300 font-hud">ROLE MODEL</p><p className="text-sm text-slate-300 mt-2">PLAYER → COMPETE</p><p className="text-sm text-slate-300">ADMIN → CONTROL</p></div>
          </div>
        </section>
      )}

      {activeTab === "tournaments" && !showForm && (
        <section>
          <div className="flex items-end justify-between mb-5"><div><p className="hud-label">Management</p><h2 className="font-display text-2xl font-bold text-white mt-1">All Tournaments</h2></div><button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><PlusCircle size={15} /> New Tournament</button></div>
          <div className="grid md:grid-cols-2 gap-4">
            {tournaments.map((t) => <div key={t.id} className="panel p-5"><div className="flex justify-between gap-3"><div className="flex items-center gap-2"><Gamepad2 size={16} className="text-cyan-400" /><span className="hud-label">{gameMeta[t.game]?.name || t.game}</span></div><span className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">{t.status.replace("_", " ")}</span></div><h3 className="font-hud font-semibold text-white mt-4">{t.name}</h3><div className="grid grid-cols-2 gap-3 mt-4 text-xs"><div><span className="text-slate-600">Prize</span><p className="text-slate-200 mt-1">₹{Number(t.prizePool).toLocaleString("en-IN")}</p></div><div><span className="text-slate-600">Teams</span><p className="text-slate-200 mt-1">{t.registeredTeams}/{t.maxTeams}</p></div><div><span className="text-slate-600">Starts</span><p className="text-slate-200 mt-1">{t.startDate}</p></div><div><span className="text-slate-600">Deadline</span><p className="text-slate-200 mt-1">{t.registrationDeadline}</p></div></div><Link to={`/tournaments/${t.id}`} className="btn-outline w-full text-center text-xs mt-5 block">Manage / View</Link></div>)}
          </div>
        </section>
      )}

      {activeTab === "matches" && !showForm && (
        <section className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
              <div><p className="hud-label">Bracket & results</p><h2 className="font-display text-2xl font-bold text-white mt-1">Matches</h2></div>
              <select value={matchFilterId} onChange={(e) => setMatchFilterId(e.target.value)} className="input-field w-auto text-xs py-2">
                <option value="all">All Tournaments</option>
                {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              {filteredMatches.length === 0 ? (
                <div className="panel p-8 text-center text-slate-500 text-sm">No matches yet. Create one using the form.</div>
              ) : (
                filteredMatches.map((m) => (
                  <MatchResultRow key={m.id} match={m} teams={teams.filter((t) => t.tournamentIds?.includes(m.tournamentId))} onSave={updateMatchResult} onSetTeam={setMatchTeam} />
                ))
              )}
            </div>
          </div>
          <div className="panel p-5 h-fit">
            <div className="flex items-center gap-2 mb-1"><Swords size={16} className="text-cyan-400" /><p className="hud-label">Schedule builder</p></div>
            <h3 className="font-display text-xl font-bold text-white mt-1">Create a match</h3>
            <form onSubmit={submitMatch} className="mt-5 space-y-3">
              <select required value={matchForm.tournamentId} onChange={(e) => updateMatchField("tournamentId", e.target.value)} className="input-field">
                <option value="">Choose tournament</option>
                {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input required list="round-options" value={matchForm.round} onChange={(e) => updateMatchField("round", e.target.value)} className="input-field" placeholder="Round" />
                <datalist id="round-options">{ROUND_OPTIONS.map((r) => <option key={r} value={r} />)}</datalist>
                <input required min="1" type="number" value={matchForm.matchNumber} onChange={(e) => updateMatchField("matchNumber", e.target.value)} className="input-field" placeholder="Match #" />
              </div>
              <div>
                <label className="label-field text-[10px]">Team A</label>
                <select value={matchForm.teamAId} onChange={(e) => updateMatchField("teamAId", e.target.value)} className="input-field">
                  <option value="">— Not decided yet (use label) —</option>
                  {eligibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {!matchForm.teamAId && <input value={matchForm.teamALabel} onChange={(e) => updateMatchField("teamALabel", e.target.value)} className="input-field mt-2" placeholder='Placeholder label, e.g. "TBD" or "Winner M4"' />}
              </div>
              <div>
                <label className="label-field text-[10px]">Team B</label>
                <select value={matchForm.teamBId} onChange={(e) => updateMatchField("teamBId", e.target.value)} className="input-field">
                  <option value="">— Not decided yet (use label) —</option>
                  {eligibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {!matchForm.teamBId && <input value={matchForm.teamBLabel} onChange={(e) => updateMatchField("teamBLabel", e.target.value)} className="input-field mt-2" placeholder='Placeholder label, e.g. "TBD" or "Winner M4"' />}
              </div>
              <div>
                <label className="label-field text-[10px] flex items-center gap-1"><CalendarClock size={12} /> Scheduled at</label>
                <input required type="datetime-local" value={matchForm.scheduledAt} onChange={(e) => updateMatchField("scheduledAt", e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field text-[10px] flex items-center gap-1"><KeyRound size={12} /> Room ID (optional)</label>
                  <input value={matchForm.roomId} onChange={(e) => updateMatchField("roomId", e.target.value)} className="input-field" placeholder="Announce later if unsure" />
                </div>
                <div>
                  <label className="label-field text-[10px]">Room Password</label>
                  <input value={matchForm.roomPassword} onChange={(e) => updateMatchField("roomPassword", e.target.value)} className="input-field" placeholder="Optional" />
                </div>
              </div>
              {matchFormError && <p className="text-live-400 text-sm">{matchFormError}</p>}
              <button className="btn-primary w-full">Add to schedule</button>
            </form>
            <p className="text-xs text-slate-600 mt-4">Teams shown are those registered for the chosen tournament. Leave Room ID blank now and announce it from the match list below whenever you're ready — that's usually right before the match starts.</p>
          </div>
        </section>
      )}

      {activeTab === "payments" && !showForm && (
        <section className="grid xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="mb-5"><p className="hud-label">Finance control</p><h2 className="font-display text-2xl font-bold text-white mt-1">Payment verification</h2><p className="text-sm text-slate-500 mt-2">Approve only after checking your bank or payment-provider dashboard. Never treat a screenshot or UTR alone as proof.</p></div>
            <div className="grid sm:grid-cols-3 gap-3 mb-5"><div className="panel p-4"><p className="hud-label">Pending</p><p className="font-display text-2xl text-white mt-2">{payments.filter((p) => p.status === "pending").length}</p></div><div className="panel p-4"><p className="hud-label">Approved revenue</p><p className="font-display text-2xl text-cyan-300 mt-2">₹{approvedRevenue.toLocaleString("en-IN")}</p></div><div className="panel p-4"><p className="hud-label">Recorded prizes</p><p className="font-display text-2xl text-volt-300 mt-2">₹{paidPrizes.toLocaleString("en-IN")}</p></div></div>
            <div className="panel overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b border-white/10 text-left"><th className="hud-label px-4 py-4">Team / tournament</th><th className="hud-label px-4 py-4">Amount</th><th className="hud-label px-4 py-4">UTR</th><th className="hud-label px-4 py-4">Status</th><th className="hud-label px-4 py-4 text-right">Review</th></tr></thead><tbody>{payments.length ? payments.map((payment) => { const team = teams.find((item) => item.id === payment.teamId); const tournament = tournaments.find((item) => item.id === payment.tournamentId); return <tr key={payment.id} className="border-b border-white/5"><td className="px-4 py-4"><p className="text-slate-200 font-hud">{team?.name || "Unknown team"}</p><p className="text-xs text-slate-500 mt-1">{tournament?.name}</p></td><td className="px-4 py-4 text-slate-200">₹{payment.amount}</td><td className="px-4 py-4 font-mono text-cyan-300">{payment.utr}</td><td className="px-4 py-4 capitalize text-slate-300">{payment.status}</td><td className="px-4 py-4 text-right">{payment.status === "pending" ? <div className="flex justify-end gap-2"><button onClick={() => reviewPayment(payment.id, true)} className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">Approve</button><button onClick={() => reviewPayment(payment.id, false)} className="badge bg-live-500/10 text-live-300 border border-live-500/25">Reject</button></div> : "—"}</td></tr>; }) : <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">No payment claims yet.</td></tr>}</tbody></table></div>
          </div>
          <div className="panel p-5 h-fit"><p className="hud-label">Payout ledger</p><h3 className="font-display text-xl font-bold text-white mt-1">Record a prize payout</h3><form onSubmit={async (e) => { e.preventDefault(); try { await recordPayout(payoutForm.tournamentId, payoutForm.placement, payoutForm.recipient, payoutForm.upiId, payoutForm.amount); setPayoutForm({ tournamentId: "", placement: "1st place", recipient: "", upiId: "", amount: "" }); } catch (error) { alert(error.message); } }} className="mt-5 space-y-3"><select required value={payoutForm.tournamentId} onChange={(e) => setPayoutForm({ ...payoutForm, tournamentId: e.target.value })} className="input-field"><option value="">Choose tournament</option>{tournaments.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><input required value={payoutForm.placement} onChange={(e) => setPayoutForm({ ...payoutForm, placement: e.target.value })} className="input-field" placeholder="Placement" /><input required value={payoutForm.recipient} onChange={(e) => setPayoutForm({ ...payoutForm, recipient: e.target.value })} className="input-field" placeholder="Winner / captain name" /><input required value={payoutForm.upiId} onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })} className="input-field" placeholder="Winner UPI ID" /><input required min="1" type="number" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} className="input-field" placeholder="Amount (₹)" /><button className="btn-primary w-full">Record payout as paid</button></form><p className="text-xs text-slate-600 mt-4">This is an audit record, not a bank transfer. Confirm the transfer outside the app before marking it paid.</p></div>
        </section>
      )}

      {activeTab === "reports" && !showForm && (
        <section><div className="mb-5"><p className="hud-label">Moderation</p><h2 className="font-display text-2xl font-bold text-white mt-1">Reports & Disputes</h2></div><div className="flex flex-col gap-3">{reports.map((r) => <div key={r.id} className="panel p-5 flex items-center justify-between flex-wrap gap-4"><div><p className="font-hud font-semibold text-white text-sm">{r.subject}</p><p className="text-xs text-slate-500 mt-1">{r.team}</p></div><div className="flex gap-2"><button className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 flex items-center gap-1 hover:bg-cyan-500/20"><Check size={12} /> Resolve</button><button className="badge bg-live-500/10 text-live-400 border border-live-500/25 flex items-center gap-1 hover:bg-live-500/20"><X size={12} /> Dismiss</button></div></div>)}</div></section>
      )}

      {activeTab === "users" && !showForm && (
        <section><div className="mb-5"><p className="hud-label">Campus accounts</p><h2 className="font-display text-2xl font-bold text-white mt-1">User Management</h2></div><div className="panel overflow-x-auto"><table className="w-full text-sm min-w-[600px]"><thead><tr className="border-b border-white/10 text-left"><th className="hud-label px-5 py-4">Name</th><th className="hud-label px-5 py-4">Role</th><th className="hud-label px-5 py-4">Status</th><th className="hud-label px-5 py-4 text-right">Action</th></tr></thead><tbody>{users.map((u) => <tr key={u.id} className="border-b border-white/5 last:border-0"><td className="px-5 py-4 text-slate-200 font-hud">{u.name}</td><td className="px-5 py-4 text-slate-400 capitalize">{u.role}</td><td className="px-5 py-4 text-cyan-400 text-xs">{u.verified ? "Verified" : "Unverified"}</td><td className="px-5 py-4 text-right"><button className="badge bg-live-500/10 text-live-400 border border-live-500/25 inline-flex items-center gap-1 hover:bg-live-500/20"><Ban size={12} /> Ban</button></td></tr>)}</tbody></table></div></section>
      )}

      <p className="text-center text-[11px] text-slate-700 mt-10">Campus Clash Admin Console · Backend-ready role boundary: ADMIN</p>
    </div>
  );
}

// Inline editor for one match row: score, kills, and status, saved together
// via updateMatchResult. Also lets the admin fill in a still-TBD team slot
// once the winner of a previous round is known.
function MatchResultRow({ match, teams, onSave, onSetTeam }) {
  const [scoreA, setScoreA] = useState(match.scoreA ?? 0);
  const [scoreB, setScoreB] = useState(match.scoreB ?? 0);
  const [killsA, setKillsA] = useState(match.killsA ?? 0);
  const [killsB, setKillsB] = useState(match.killsB ?? 0);
  const [status, setStatus] = useState(match.status);
  const [roomId, setRoomId] = useState(match.roomId ?? "");
  const [roomPassword, setRoomPassword] = useState(match.roomPassword ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(match.id, { scoreA, scoreB, killsA, killsB, status, roomId, roomPassword });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div>
          <p className="hud-label text-volt-400">{match.round} · Match #{match.matchNumber}</p>
          <p className="font-hud font-semibold text-white text-sm mt-1">{match.teamA} vs {match.teamB}</p>
        </div>
        <Link to={`/match/${match.id}`} className="btn-outline text-[10px] px-3 py-2 shrink-0">Open live page</Link>
      </div>

      {!match.teamAId && (
        <select onChange={(e) => e.target.value && onSetTeam(match.id, "A", e.target.value)} defaultValue="" className="input-field text-xs mb-2">
          <option value="">Set Team A (currently "{match.teamA}")…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      {!match.teamBId && (
        <select onChange={(e) => e.target.value && onSetTeam(match.id, "B", e.target.value)} defaultValue="" className="input-field text-xs mb-3">
          <option value="">Set Team B (currently "{match.teamB}")…</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div><label className="label-field text-[9px]">Score A</label><input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} className="input-field text-sm py-1.5" /></div>
        <div><label className="label-field text-[9px]">Score B</label><input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} className="input-field text-sm py-1.5" /></div>
        <div><label className="label-field text-[9px]">Kills A</label><input type="number" min="0" value={killsA} onChange={(e) => setKillsA(Number(e.target.value))} className="input-field text-sm py-1.5" /></div>
        <div><label className="label-field text-[9px]">Kills B</label><input type="number" min="0" value={killsB} onChange={(e) => setKillsB(Number(e.target.value))} className="input-field text-sm py-1.5" /></div>
        <div>
          <label className="label-field text-[9px]">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field text-sm py-1.5">
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div><label className="label-field text-[9px] flex items-center gap-1"><KeyRound size={10} /> Room ID</label><input value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-field text-sm py-1.5" placeholder="Announce room ID" /></div>
        <div><label className="label-field text-[9px]">Room Password</label><input value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} className="input-field text-sm py-1.5" placeholder="Optional" /></div>
      </div>
      {error && <p className="text-live-400 text-xs mt-2">{error}</p>}
      <button onClick={save} disabled={saving} className="btn-outline text-xs px-4 py-2 mt-3 disabled:opacity-50">{saving ? "Saving…" : "Save result"}</button>
    </div>
  );
}
