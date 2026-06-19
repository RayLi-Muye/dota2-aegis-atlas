import type { DotaOverview, HeroSummary, MatchReplay, PlayerProfile } from "./types";

const makeHero = (
  id: number,
  name: string,
  slug: string,
  primaryAttr: HeroSummary["primaryAttr"],
  roles: string[],
  pubPick: number,
  pubWinRate: number,
  proPick: number,
): HeroSummary => ({
  id,
  name,
  slug,
  primaryAttr,
  attackType: id % 2 === 0 ? "Melee" : "Ranged",
  roles,
  imageUrl: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`,
  iconUrl: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${slug}.png`,
  pubPick,
  pubWin: Math.round(pubPick * pubWinRate),
  pubWinRate,
  proPick,
  proBan: Math.round(proPick * 0.8),
  proWinRate: proPick > 0 ? Math.max(0.38, Math.min(0.61, pubWinRate + 0.03)) : null,
  rankBuckets: ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine"].map((label, index) => {
    const picks = Math.round(pubPick / (11 - index));
    const winRate = Math.max(0.42, Math.min(0.59, pubWinRate + (index - 3) * 0.006));
    return { label, picks, wins: Math.round(picks * winRate), winRate };
  }),
  trend: ["D-6", "D-5", "D-4", "D-3", "D-2", "D-1", "Now"].map((label, index) => {
    const picks = Math.round((pubPick / 7) * (0.88 + index * 0.04));
    const winRate = Math.max(0.42, Math.min(0.6, pubWinRate + (index - 3) * 0.004));
    return { label, picks, wins: Math.round(picks * winRate), winRate };
  }),
});

export const fallbackHeroes: HeroSummary[] = [
  makeHero(2, "Axe", "axe", "str", ["Initiator", "Durable", "Disabler"], 485000, 0.522, 43),
  makeHero(11, "Shadow Fiend", "nevermore", "agi", ["Carry", "Nuker"], 451000, 0.493, 31),
  makeHero(14, "Pudge", "pudge", "str", ["Disabler", "Durable"], 602000, 0.508, 18),
  makeHero(26, "Lion", "lion", "int", ["Support", "Disabler", "Nuker"], 388000, 0.516, 27),
  makeHero(35, "Sniper", "sniper", "agi", ["Carry", "Nuker"], 420000, 0.519, 22),
  makeHero(86, "Rubick", "rubick", "int", ["Support", "Disabler"], 304000, 0.489, 52),
  makeHero(100, "Tusk", "tusk", "str", ["Initiator", "Disabler"], 212000, 0.511, 68),
  makeHero(136, "Marci", "marci", "all", ["Support", "Carry", "Initiator"], 198000, 0.535, 39),
];

export const fallbackPlayer: PlayerProfile = {
  accountId: "86745912",
  winRate: 0.62,
  avgKda: 5.1,
  avgGpm: 612,
  avgXpm: 728,
  signatureHeroes: [
    { heroId: 6, heroName: "Drow Ranger", matches: 4, winRate: 0.75 },
    { heroId: 19, heroName: "Tiny", matches: 3, winRate: 0.66 },
    { heroId: 53, heroName: "Nature's Prophet", matches: 3, winRate: 0.66 },
  ],
  recentMatches: [
    {
      matchId: 8848026973,
      heroId: 19,
      heroName: "Tiny",
      result: "Loss",
      duration: 2180,
      kills: 5,
      deaths: 3,
      assists: 6,
      gpm: 543,
      xpm: 720,
      heroDamage: 13825,
      towerDamage: 612,
      startTime: 1781206413,
      averageRank: 75,
    },
    {
      matchId: 8847774380,
      heroId: 6,
      heroName: "Drow Ranger",
      result: "Win",
      duration: 1697,
      kills: 9,
      deaths: 1,
      assists: 6,
      gpm: 758,
      xpm: 869,
      heroDamage: 16676,
      towerDamage: 9133,
      startTime: 1781193400,
      averageRank: 75,
    },
  ],
};

export const fallbackMatch: MatchReplay = {
  matchId: 8854301438,
  duration: 2215,
  radiantWin: false,
  radiantScore: 12,
  direScore: 30,
  leagueName: "The International 2026 - Regional Qualifier China",
  teamfights: [
    { start: 392, end: 427, deaths: 3 },
    { start: 1095, end: 1134, deaths: 3 },
    { start: 1802, end: 1842, deaths: 3 },
    { start: 1982, end: 2029, deaths: 3 },
  ],
  events: [
    { time: 133, type: "firstblood", side: "Radiant", label: "First blood near offlane river" },
    { time: 874, type: "tower", side: "Radiant", label: "Dire top T1 falls" },
    { time: 1304, type: "roshan", side: "Dire", label: "Dire claims Roshan and Aegis" },
    { time: 1948, type: "roshan", side: "Dire", label: "Second Roshan, Dire Aegis" },
    { time: 2216, type: "ancient", side: "Dire", label: "Dire closes the game" },
  ],
  mapPoints: [
    { x: 28, y: 68, kind: "Observer", side: "Radiant", time: 410, intensity: 0.8, label: "Radiant river observer" },
    { x: 61, y: 47, kind: "Sentry", side: "Dire", time: 665, intensity: 0.7, label: "Dire mid sentry" },
    { x: 70, y: 28, kind: "Observer", side: "Dire", time: 980, intensity: 1, label: "Dire triangle observer" },
    { x: 46, y: 58, kind: "Death", side: "Radiant", time: 133, intensity: 0.9, label: "First blood" },
    { x: 74, y: 21, kind: "Death", side: "Radiant", time: 1827, intensity: 1, label: "High-ground collapse" },
  ],
};

export const fallbackOverview: DotaOverview = {
  generatedAt: new Date().toISOString(),
  dataFreshness: "sample",
  dataLastUpdated: null,
  patchVersion: "Bundled sample snapshot",
  selectedHero: fallbackHeroes[0],
  heroMeta: fallbackHeroes,
  matchups: fallbackHeroes.slice(1).map((hero, index) => ({
    heroId: hero.id,
    heroName: hero.name,
    games: 120 - index * 9,
    wins: 62 - index * 4,
    winRate: (62 - index * 4) / (120 - index * 9),
    advantage: 0.5 - (62 - index * 4) / (120 - index * 9),
  })),
  items: [
    { phase: "Start", itemId: 16, name: "Iron Branch", count: 166, cost: 50, imageUrl: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/branches.png" },
    { phase: "Early", itemId: 29, name: "Boots of Speed", count: 99, cost: 500, imageUrl: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/boots.png" },
    { phase: "Mid", itemId: 145, name: "Battle Fury", count: 95, cost: 4100, imageUrl: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/bfury.png" },
    { phase: "Late", itemId: 160, name: "Manta Style", count: 26, cost: 4650, imageUrl: "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/manta.png" },
  ],
  player: fallbackPlayer,
  match: fallbackMatch,
  proMatches: [
    {
      matchId: 8854301438,
      radiantName: "Vici Gaming",
      direName: "Yakutou Brothers",
      radiantScore: 12,
      direScore: 30,
      duration: 2215,
      leagueName: "The International 2026 - Regional Qualifier China",
    },
  ],
  sources: [
    { name: "OpenDota", status: "sample", lastUpdated: null, note: "No cached OpenDota data is available; showing bundled sample data for local resilience." },
    { name: "Steam Web API", status: "optional", lastUpdated: null, note: "Planned for official static and account-backed data." },
    { name: "STRATZ GraphQL", status: "optional", lastUpdated: null, note: "Planned for patch, talent, and advanced meta data when token is configured." },
  ],
};
