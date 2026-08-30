export const gameMeta = {
  freefire: { name: "Free Fire", icon: "🔥", color: "#FF6B00" },
  bgmi: { name: "BGMI", icon: "🎯", color: "#F2A900" },
  valorant: { name: "Valorant", icon: "💠", color: "#FF4655" },
  fifa: { name: "FIFA", icon: "⚽", color: "#00A8E1" },
  codm: { name: "COD Mobile", icon: "🪖", color: "#4CAF50" },
};

// Every mode a tournament can be run as, per game, with the number of
// players that make up one team in that mode. This drives both the Admin
// tournament-creator's Mode dropdown and how many player slots
// TeamRegistration.jsx renders — so team size always matches the mode a
// tournament was actually created for.
export const gameModes = {
  freefire: [
    { id: "br_solo", name: "Battle Royale — Solo", teamSize: 1 },
    { id: "br_duo", name: "Battle Royale — Duo", teamSize: 2 },
    { id: "br_squad", name: "Battle Royale — Squad", teamSize: 4 },
    { id: "clash_squad", name: "Clash Squad (4v4)", teamSize: 4 },
    { id: "lone_wolf_1v1", name: "Lone Wolf — 1v1", teamSize: 1 },
    { id: "lone_wolf_2v2", name: "Lone Wolf — 2v2", teamSize: 2 },
  ],
  bgmi: [
    { id: "br_solo", name: "Classic — Solo", teamSize: 1 },
    { id: "br_duo", name: "Classic — Duo", teamSize: 2 },
    { id: "br_squad", name: "Classic — Squad", teamSize: 4 },
  ],
  valorant: [{ id: "standard_5v5", name: "Standard 5v5", teamSize: 5 }],
  fifa: [
    { id: "one_v_one", name: "1v1", teamSize: 1 },
    { id: "two_v_two", name: "2v2 Co-op", teamSize: 2 },
  ],
  codm: [
    { id: "br_squad", name: "Battle Royale — Squad", teamSize: 4 },
    { id: "mp_5v5", name: "Multiplayer 5v5", teamSize: 5 },
  ],
};

export function modesForGame(gameId) {
  return gameModes[gameId] || gameModes.freefire;
}

export function findMode(gameId, modeId) {
  return modesForGame(gameId).find((m) => m.id === modeId);
}

export function modeLabel(gameId, modeId) {
  return findMode(gameId, modeId)?.name || "Squad";
}
