export const teams = [
  { id: "t1", name: "Team Alpha", tag: "ALP", college: "KL University", captain: "Rahul Varma", logo: "🐺", wins: 4, matches: 5, kills: 42, points: 88, tournamentIds: ["tr1"] },
  { id: "t2", name: "Team Titans", tag: "TTN", college: "KL University", captain: "Sameer Khan", logo: "⚡", wins: 3, matches: 5, kills: 37, points: 74, tournamentIds: ["tr1"] },
  { id: "t3", name: "Phoenix Squad", tag: "PHX", college: "KL University", captain: "Ananya Rao", logo: "🔥", wins: 3, matches: 5, kills: 31, points: 68, tournamentIds: ["tr1"] },
  { id: "t4", name: "Shadow Reapers", tag: "SHD", college: "KL University", captain: "Vikram Singh", logo: "💀", wins: 2, matches: 5, kills: 29, points: 59, tournamentIds: ["tr1"] },
  { id: "t5", name: "Venom Squad", tag: "VNM", college: "KL University", captain: "Priya Nair", logo: "🐍", wins: 2, matches: 4, kills: 25, points: 51, tournamentIds: ["tr1"] },
  { id: "t6", name: "Warriors", tag: "WAR", college: "KL University", captain: "Arjun Mehta", logo: "⚔️", wins: 2, matches: 4, kills: 22, points: 47, tournamentIds: ["tr2"] },
  { id: "t7", name: "Phantom Force", tag: "PHF", college: "KL University", captain: "Kiran Reddy", logo: "👻", wins: 1, matches: 4, kills: 20, points: 40, tournamentIds: ["tr2"] },
  { id: "t8", name: "Nova Squad", tag: "NOV", college: "KL University", captain: "Divya Iyer", logo: "🌟", wins: 1, matches: 3, kills: 15, points: 32, tournamentIds: ["tr2"] },
  { id: "t9", name: "Rogue Elites", tag: "RGE", college: "KL University", captain: "Farhan Ali", logo: "🎯", wins: 1, matches: 3, kills: 13, points: 28, tournamentIds: ["tr2"] },
  { id: "t10", name: "Crimson Wolves", tag: "CRW", college: "KL University", captain: "Meera Pillai", logo: "🐺", wins: 0, matches: 3, kills: 9, points: 18, tournamentIds: ["tr2"] },
];

export const getTeamsByTournament = (tournamentId) =>
  teams.filter((t) => t.tournamentIds.includes(tournamentId));
