import { createServer } from "node:http";
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tournaments as seedTournaments } from "../src/data/tournaments.js";
import { teams as seedTeams } from "../src/data/teams.js";

const root = dirname(fileURLToPath(import.meta.url));
const dbPath = join(root, "data", "campus-clash.json");
const port = Number(process.env.PORT || 8787);
const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "development-only-change-this-secret");
if (!secret) throw new Error("AUTH_SECRET is required in production.");

const id = (prefix) => `${prefix}_${randomBytes(12).toString("hex")}`;
const now = () => new Date().toISOString();
const safeUser = (user) => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};
const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
};
const passwordMatches = (password, stored) => {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
};
const sign = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
};
const verify = (token) => {
  const [encoded, signature] = (token || "").split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  return payload.exp > Date.now() ? payload : null;
};
const tokenFor = (user) => sign({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 12 });

function load() {
  if (!existsSync(dbPath)) {
    mkdirSync(dirname(dbPath), { recursive: true });
    const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    const firstRun = { users: [{ id: id("user"), name: "Campus Clash Admin", email: (process.env.ADMIN_EMAIL || "admin@campusclash.local").toLowerCase(), collegeId: "ADMIN", role: "admin", verified: true, passwordHash: hashPassword(adminPassword), createdAt: now() }], tournaments: structuredClone(seedTournaments), teams: structuredClone(seedTeams), payments: [], payouts: [], auditLog: [] };
    writeFileSync(dbPath, JSON.stringify(firstRun, null, 2));
    if (!process.env.ADMIN_PASSWORD) console.warn("Development admin password: ChangeMe123! — set ADMIN_PASSWORD before any real use.");
  }
  const existing = JSON.parse(readFileSync(dbPath, "utf8"));
  if (!existing.tournaments?.length && !existing.teams?.length) {
    existing.tournaments = structuredClone(seedTournaments);
    existing.teams = structuredClone(seedTeams);
    writeFileSync(dbPath, JSON.stringify(existing, null, 2));
  }
  return existing;
}
let db = load();
const save = () => writeFileSync(dbPath, JSON.stringify(db, null, 2));
const audit = (actorId, action, entity, entityId) => db.auditLog.unshift({ id: id("audit"), actorId, action, entity, entityId, at: now() });

function send(res, status, body) { res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN || "http://localhost:5173", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS" }); res.end(JSON.stringify(body)); }
function getBody(req) { return new Promise((resolve, reject) => { let raw = ""; req.on("data", (chunk) => { raw += chunk; if (raw.length > 1_000_000) reject(new Error("Request too large")); }); req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); } }); }); }
function currentUser(req) { const payload = verify(req.headers.authorization?.replace("Bearer ", "")); return payload && db.users.find((user) => user.id === payload.sub); }
function requireUser(req, res, role) { const user = currentUser(req); if (!user) { send(res, 401, { error: "Authentication required." }); return null; } if (role && user.role !== role) { send(res, 403, { error: "You do not have permission for this action." }); return null; } return user; }
function publicTournament(tournament) { return tournament; }

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  try {
    if (req.method === "GET" && path === "/api/health") return send(res, 200, { ok: true, time: now() });
    if (req.method === "POST" && path === "/api/auth/signup") {
      const { name, email, collegeId, password } = await getBody(req);
      if (!name?.trim() || !collegeId?.trim() || !/^\S+@\S+\.\S+$/.test(email || "") || !password || password.length < 8) return send(res, 400, { error: "Name, college ID, valid email, and an 8+ character password are required." });
      if (db.users.some((user) => user.email === email.toLowerCase())) return send(res, 409, { error: "An account already exists for this email." });
      const user = { id: id("user"), name: name.trim(), email: email.toLowerCase(), collegeId: collegeId.trim(), role: "player", verified: false, passwordHash: hashPassword(password), createdAt: now() };
      db.users.push(user); audit(user.id, "account.created", "user", user.id); save(); return send(res, 201, { token: tokenFor(user), user: safeUser(user) });
    }
    if (req.method === "POST" && path === "/api/auth/login") {
      const { email, password } = await getBody(req); const user = db.users.find((item) => item.email === (email || "").toLowerCase());
      if (!user || !passwordMatches(password || "", user.passwordHash)) return send(res, 401, { error: "Invalid email or password." });
      return send(res, 200, { token: tokenFor(user), user: safeUser(user) });
    }
    if (req.method === "GET" && path === "/api/auth/me") { const user = requireUser(req, res); if (user) return send(res, 200, { user: safeUser(user) }); return; }
    if (req.method === "GET" && path === "/api/tournaments") return send(res, 200, { tournaments: db.tournaments.map(publicTournament) });
    if (req.method === "POST" && path === "/api/tournaments") {
      const user = requireUser(req, res, "admin"); if (!user) return; const data = await getBody(req);
      const prizePool = Number(data.prizePool); const split = data.prizeSplit || {}; const splitTotal = [split.first, split.second, split.third].reduce((sum, amount) => sum + Number(amount || 0), 0);
      if (!data.name?.trim() || !data.game || !Number.isFinite(prizePool) || prizePool < 0 || splitTotal > prizePool) return send(res, 400, { error: "Invalid tournament data or prize split." });
      const tournament = { id: id("tournament"), name: data.name.trim(), game: data.game, host: data.host?.trim() || "Campus Clash", description: data.description?.trim() || "", entryFee: Number(data.entryFee || 0), prizePool, prizeSplit: { first: Number(split.first || 0), second: Number(split.second || 0), third: Number(split.third || 0) }, maxTeams: Number(data.maxTeams || 16), registeredTeams: 0, registrationDeadline: data.registrationDeadline, startDate: data.startDate, status: "open", rules: Array.isArray(data.rules) ? data.rules : [], createdAt: now() };
      db.tournaments.push(tournament); audit(user.id, "tournament.created", "tournament", tournament.id); save(); return send(res, 201, { tournament });
    }
    const registrationMatch = path.match(/^\/api\/tournaments\/([^/]+)\/registrations$/);
    if (req.method === "POST" && registrationMatch) {
      const user = requireUser(req, res); if (!user) return; const tournament = db.tournaments.find((item) => item.id === registrationMatch[1]); const data = await getBody(req);
      if (!tournament || tournament.status !== "open") return send(res, 400, { error: "Registration is not open for this tournament." });
      if (new Date(tournament.registrationDeadline) < new Date()) return send(res, 400, { error: "The registration deadline has passed." });
      if (tournament.registeredTeams >= tournament.maxTeams) return send(res, 400, { error: "Tournament is full." });
      if (!data.acceptedTerms || !data.teamName?.trim() || !Array.isArray(data.players) || data.players.length < 4) return send(res, 400, { error: "Complete team details and accept the rules." });
      const team = { id: id("team"), name: data.teamName.trim(), captain: user.name, captainUserId: user.id, college: data.college || "", players: data.players, tournamentIds: [tournament.id], registrationStatus: tournament.entryFee ? "payment_pending" : "confirmed", createdAt: now() };
      db.teams.push(team); if (!tournament.entryFee) tournament.registeredTeams += 1; audit(user.id, "team.registered", "team", team.id); save(); return send(res, 201, { team });
    }
    if (req.method === "POST" && path === "/api/payments") {
      const user = requireUser(req, res); if (!user) return; const { teamId, utr, payerUpi } = await getBody(req); const team = db.teams.find((item) => item.id === teamId && item.captainUserId === user.id); const tournament = team && db.tournaments.find((item) => item.id === team.tournamentIds[0]);
      if (!team || !tournament?.entryFee || !utr?.trim() || !payerUpi?.trim()) return send(res, 400, { error: "Valid team, UTR, and payer UPI ID are required." });
      if (db.payments.some((payment) => payment.utr.toLowerCase() === utr.trim().toLowerCase())) return send(res, 409, { error: "This UTR has already been submitted." });
      const payment = { id: id("payment"), teamId, tournamentId: tournament.id, amount: tournament.entryFee, utr: utr.trim(), payerUpi: payerUpi.trim(), status: "pending", createdAt: now() }; db.payments.push(payment); audit(user.id, "payment.submitted", "payment", payment.id); save(); return send(res, 201, { payment });
    }
    if (req.method === "GET" && path === "/api/admin/payments") { const user = requireUser(req, res, "admin"); if (user) return send(res, 200, { payments: db.payments }); return; }
    const paymentReview = path.match(/^\/api\/admin\/payments\/([^/]+)$/);
    if (req.method === "PATCH" && paymentReview) { const user = requireUser(req, res, "admin"); if (!user) return; const { approved } = await getBody(req); const payment = db.payments.find((item) => item.id === paymentReview[1]); if (!payment || payment.status !== "pending") return send(res, 400, { error: "Payment cannot be reviewed." }); payment.status = approved === true ? "approved" : "rejected"; payment.reviewedAt = now(); payment.reviewedBy = user.id; const team = db.teams.find((item) => item.id === payment.teamId); const tournament = db.tournaments.find((item) => item.id === payment.tournamentId); if (approved === true && team && tournament) { team.registrationStatus = "confirmed"; tournament.registeredTeams += 1; } else if (team) team.registrationStatus = "payment_rejected"; audit(user.id, `payment.${payment.status}`, "payment", payment.id); save(); return send(res, 200, { payment }); }
    if (req.method === "POST" && path === "/api/admin/payouts") { const user = requireUser(req, res, "admin"); if (!user) return; const { tournamentId, placement, recipient, upiId, amount } = await getBody(req); const tournament = db.tournaments.find((item) => item.id === tournamentId); if (!tournament || !recipient?.trim() || !upiId?.trim() || !Number(amount)) return send(res, 400, { error: "Valid payout details are required." }); const paid = db.payouts.filter((item) => item.tournamentId === tournamentId).reduce((sum, item) => sum + item.amount, 0); if (paid + Number(amount) > tournament.prizePool) return send(res, 400, { error: "Payout exceeds the advertised prize pool." }); const payout = { id: id("payout"), tournamentId, placement: placement?.trim() || "Prize", recipient: recipient.trim(), upiId: upiId.trim(), amount: Number(amount), status: "paid", paidAt: now(), recordedBy: user.id }; db.payouts.push(payout); audit(user.id, "payout.recorded", "payout", payout.id); save(); return send(res, 201, { payout }); }
    return send(res, 404, { error: "Not found." });
  } catch (error) { console.error(error); return send(res, 500, { error: "Server error. Check server logs." }); }
});
server.listen(port, () => console.log(`Campus Clash API running at http://localhost:${port}`));
