import { useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy, ShieldCheck, Smartphone, TriangleAlert } from "lucide-react";
import { useData } from "../context/DataContext";

export default function PaymentCheckout() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { tournaments, teams, payments, submitPayment } = useData();
  const tournament = tournaments.find((item) => item.id === id);
  const team = teams.find((item) => item.id === params.get("team") && item.tournamentIds?.includes(id));
  const payment = payments.find((item) => item.teamId === team?.id && item.tournamentId === id);
  const [utr, setUtr] = useState("");
  const [payerUpi, setPayerUpi] = useState("");
  const [error, setError] = useState("");
  const upiId = "campusclash@upi";

  if (!tournament || !team) return <Navigate to={`/tournaments/${id}`} replace />;
  if (!tournament.entryFee) return <Navigate to={`/tournaments/${id}`} replace />;

  const copyUpi = async () => { await navigator.clipboard?.writeText(upiId); };
  const submit = async (event) => {
    event.preventDefault();
    try { await submitPayment(id, team.id, { utr, payerUpi }); }
    catch (submissionError) { setError(submissionError.message); }
  };

  if (payment) return <div className="max-w-lg mx-auto px-4 py-20 text-center"><CheckCircle2 className="text-cyan-400 mx-auto mb-5" size={44} /><h1 className="font-display text-3xl font-bold text-white">Payment submitted</h1><p className="text-slate-400 mt-3">Your UPI reference is waiting for an admin review. Your team is confirmed only after approval.</p><Link className="btn-primary inline-flex mt-7" to={`/tournaments/${id}`}>Back to tournament</Link></div>;

  return <div className="max-w-xl mx-auto px-4 sm:px-6 py-12"><p className="hud-label text-cyan-400 mb-2">Secure payment record</p><h1 className="font-display text-3xl font-bold text-white">Pay entry fee</h1><p className="text-slate-400 mt-2">{team.name} · {tournament.name}</p>
    <div className="panel p-5 mt-7"><div className="flex justify-between items-center"><div><p className="hud-label">Amount due</p><p className="font-display text-3xl font-black text-white mt-1">₹{Number(tournament.entryFee).toLocaleString("en-IN")}</p></div><Smartphone className="text-cyan-400" size={28} /></div><div className="border-t border-white/10 mt-5 pt-5"><p className="text-sm text-slate-400">Pay using any UPI app to</p><div className="flex items-center justify-between gap-3 mt-2 bg-white/5 px-4 py-3"><code className="text-cyan-300 font-hud">{upiId}</code><button type="button" onClick={copyUpi} className="btn-ghost flex items-center gap-1"><Copy size={14} /> Copy</button></div><p className="text-xs text-slate-500 mt-3">Use the exact amount and save the UPI transaction reference (UTR).</p></div></div>
    <form onSubmit={submit} className="panel p-5 mt-5"><label className="label-field">UPI transaction reference / UTR</label><input required value={utr} onChange={(e) => setUtr(e.target.value)} className="input-field" placeholder="e.g. 423456789012" /><label className="label-field mt-4 block">Your UPI ID <span className="text-slate-600 normal-case">(helps resolve issues)</span></label><input required value={payerUpi} onChange={(e) => setPayerUpi(e.target.value)} className="input-field" placeholder="name@bank" />{error && <p className="text-live-400 text-xs mt-3">{error}</p>}<button className="btn-primary w-full mt-6">Submit for verification</button></form>
    <div className="flex gap-3 mt-5 text-xs text-slate-500"><ShieldCheck size={17} className="text-cyan-400 shrink-0" /><p>This demo records a payment claim; it does not verify a bank transfer. Connect a PCI-compliant payment provider and server-side webhook before accepting live payments.</p></div><div className="flex gap-3 mt-4 text-xs text-amber-300/80"><TriangleAlert size={17} className="shrink-0" /><p>Do not share your UPI PIN, OTP, or bank password with anyone.</p></div></div>;
}
