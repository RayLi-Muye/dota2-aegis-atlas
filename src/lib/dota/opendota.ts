import { fallbackHeroes, fallbackMatch, fallbackOverview, fallbackPlayer } from "./fallback";
import type {
  DataFreshness,
  DotaOverview,
  DataSourceStatus,
  HeroDetail,
  HeroDetailInsight,
  HeroMatchup,
  HeroSummary,
  ItemTiming,
  MapPoint,
  MatchEvent,
  MatchReplay,
  PlayerMatch,
  PlayerProfile,
} from "./types";

const OPENDOTA_BASE = "https://api.opendota.com/api";
const STEAM_ASSET_BASE = "https://cdn.cloudflare.steamstatic.com";
const SAMPLE_ACCOUNT_ID = "86745912";
const MAX_MATCH_POINTS = 70;

type OpenDotaCacheEntry<T> = {
  data: T;
  updatedAt: string;
};

type OpenDotaFetchResult<T> = OpenDotaCacheEntry<T> & {
  freshness: Exclude<DataFreshness, "sample">;
};

type CacheGlobal = typeof globalThis & {
  __aegisOpenDotaCache?: Map<string, OpenDotaCacheEntry<unknown>>;
};

const openDotaCache = ((globalThis as CacheGlobal).__aegisOpenDotaCache ??= new Map());

type OpenDotaHero = {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  img: string;
  icon: string;
  pub_pick?: number;
  pub_win?: number;
  pub_pick_trend?: number[];
  pub_win_trend?: number[];
  pro_pick?: number;
  pro_win?: number;
  pro_ban?: number;
  [key: string]: unknown;
};

type OpenDotaItem = {
  id?: number;
  dname?: string;
  img?: string;
  cost?: number;
};

type OpenDotaMatchup = {
  hero_id: number;
  games_played: number;
  wins: number;
};

type OpenDotaRecentMatch = {
  match_id: number;
  hero_id: number;
  radiant_win: boolean;
  player_slot: number;
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  tower_damage: number;
  start_time: number;
  average_rank?: number | null;
};

type OpenDotaProMatch = {
  match_id: number;
  duration: number;
  radiant_name?: string;
  dire_name?: string;
  league_name?: string;
  radiant_score: number;
  dire_score: number;
  version?: number | null;
};

type OpenDotaObjective = {
  time?: number;
  type?: string;
  team?: number;
  key?: string;
};

type OpenDotaWardLog = {
  time?: number;
  x?: number;
  y?: number;
};

type OpenDotaPlayer = {
  player_slot?: number;
  hero_id?: number;
  obs_log?: OpenDotaWardLog[];
  sen_log?: OpenDotaWardLog[];
  kills_log?: Array<{ time?: number; key?: string }>;
  lane_pos?: Record<string, Record<string, number>>;
};

type OpenDotaMatch = {
  match_id: number;
  duration?: number;
  radiant_win?: boolean;
  radiant_score?: number;
  dire_score?: number;
  league_name?: string;
  objectives?: OpenDotaObjective[];
  teamfights?: Array<{ start?: number; end?: number; deaths?: number }>;
  players?: OpenDotaPlayer[];
};

function assetUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  const cleanPath = path.replace(/\?.*$/, "");
  return cleanPath.startsWith("http") ? cleanPath : `${STEAM_ASSET_BASE}${cleanPath}`;
}

function ratio(wins: number | undefined, games: number | undefined): number {
  if (!wins || !games) {
    return 0;
  }
  return wins / games;
}

export function resetOpenDotaCacheForTests(): void {
  openDotaCache.clear();
}

async function fetchJson<T>(path: string, revalidateSeconds = 900): Promise<OpenDotaFetchResult<T>> {
  try {
    const response = await fetch(`${OPENDOTA_BASE}${path}`, {
      headers: {
        accept: "application/json",
        "user-agent": "AegisAtlas/0.1 (+https://github.com/RayLi-Muye)",
      },
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(`OpenDota ${path} returned ${response.status}`);
    }

    const data = (await response.json()) as T;
    const updatedAt = new Date().toISOString();
    openDotaCache.set(path, { data, updatedAt });
    return { data, updatedAt, freshness: "live" };
  } catch (error) {
    const cached = openDotaCache.get(path) as OpenDotaCacheEntry<T> | undefined;
    if (cached) {
      return { ...cached, freshness: "stale" };
    }
    throw error;
  }
}

function dataFreshness(results: Array<Pick<OpenDotaFetchResult<unknown>, "freshness">>): Exclude<DataFreshness, "sample"> {
  return results.some((result) => result.freshness === "stale") ? "stale" : "live";
}

function oldestUpdatedAt(results: Array<Pick<OpenDotaFetchResult<unknown>, "updatedAt">>): string {
  return results.map((result) => result.updatedAt).sort()[0] ?? new Date().toISOString();
}

function openDotaSources(freshness: DataFreshness, lastUpdated: string | null, liveNote: string): DataSourceStatus[] {
  const staleNote = lastUpdated
    ? `Using last cached OpenDota data because live refresh failed. Last updated ${lastUpdated}.`
    : "No cached OpenDota data is available; showing bundled sample data for local resilience.";

  return [
    {
      name: "OpenDota",
      status: freshness,
      lastUpdated,
      note: freshness === "live" ? liveNote : freshness === "stale" ? staleNote : staleNote,
    },
    { name: "Steam Web API", status: "optional", lastUpdated: null, note: "Provider slot for official Steam-backed endpoints and account-linked workflows." },
    { name: "STRATZ GraphQL", status: "optional", lastUpdated: null, note: "Provider slot for patch-specific hero, talent, and advanced meta data once a token is configured." },
  ];
}

function toHeroSummary(hero: OpenDotaHero): HeroSummary {
  const pubPick = Number(hero.pub_pick ?? 0);
  const pubWin = Number(hero.pub_win ?? 0);
  const proPick = Number(hero.pro_pick ?? 0);
  const proWin = Number(hero.pro_win ?? 0);
  const rankLabels = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine"];

  return {
    id: hero.id,
    slug: hero.name.replace("npc_dota_hero_", ""),
    name: hero.localized_name,
    primaryAttr: hero.primary_attr,
    attackType: hero.attack_type,
    roles: hero.roles ?? [],
    imageUrl: assetUrl(hero.img) ?? "",
    iconUrl: assetUrl(hero.icon) ?? "",
    pubPick,
    pubWin,
    pubWinRate: ratio(pubWin, pubPick),
    proPick,
    proBan: Number(hero.pro_ban ?? 0),
    proWinRate: proPick > 0 ? ratio(proWin, proPick) : null,
    rankBuckets: rankLabels.map((label, index) => {
      const key = String(index + 1);
      const picks = Number(hero[`${key}_pick`] ?? 0);
      const wins = Number(hero[`${key}_win`] ?? 0);
      return { label, picks, wins, winRate: ratio(wins, picks) };
    }),
    trend: (hero.pub_pick_trend ?? []).map((picks, index) => {
      const wins = Number(hero.pub_win_trend?.[index] ?? 0);
      return {
        label: index === 6 ? "Now" : `D-${6 - index}`,
        picks,
        wins,
        winRate: ratio(wins, picks),
      };
    }),
  };
}

function resolveHeroName(heroMap: Map<number, HeroSummary>, heroId: number): string {
  return heroMap.get(heroId)?.name ?? `Hero ${heroId}`;
}

function toMatchups(
  rows: OpenDotaMatchup[],
  selectedHero: HeroSummary,
  heroMap: Map<number, HeroSummary>,
): HeroMatchup[] {
  return rows
    .filter((row) => row.games_played > 0)
    .map((row) => {
      const winRate = ratio(row.wins, row.games_played);
      return {
        heroId: row.hero_id,
        heroName: resolveHeroName(heroMap, row.hero_id),
        games: row.games_played,
        wins: row.wins,
        winRate,
        advantage: selectedHero.pubWinRate - winRate,
      };
    })
    .sort((a, b) => Math.abs(b.advantage) - Math.abs(a.advantage))
    .slice(0, 12);
}

function fallbackMatchupsForHero(selectedHero: HeroSummary): HeroMatchup[] {
  return fallbackHeroes
    .filter((hero) => hero.id !== selectedHero.id)
    .map((hero, index) => {
      const games = 160 - index * 11;
      const matchupWinRate = Math.max(0.38, Math.min(0.62, selectedHero.pubWinRate + (index - 3) * 0.012));
      return {
        heroId: hero.id,
        heroName: hero.name,
        games,
        wins: Math.round(games * matchupWinRate),
        winRate: matchupWinRate,
        advantage: selectedHero.pubWinRate - matchupWinRate,
      };
    })
    .sort((a, b) => Math.abs(b.advantage) - Math.abs(a.advantage))
    .slice(0, 12);
}

function heroTrendDelta(hero: HeroSummary): number {
  const first = hero.trend[0]?.winRate;
  const last = hero.trend.at(-1)?.winRate;
  if (typeof first !== "number" || typeof last !== "number") {
    return 0;
  }
  return last - first;
}

function trendDirection(delta: number): HeroDetailInsight["trendDirection"] {
  if (delta > 0.002) {
    return "up";
  }
  if (delta < -0.002) {
    return "down";
  }
  return "flat";
}

function toHeroInsight(
  hero: HeroSummary,
  matchups: HeroMatchup[],
  items: ItemTiming[],
  freshness: DataFreshness,
): HeroDetailInsight {
  const sortedEdges = [...matchups].sort((a, b) => b.advantage - a.advantage);
  const sortedThreats = [...matchups].sort((a, b) => a.advantage - b.advantage);
  const trendDelta = heroTrendDelta(hero);
  const bestRankBucket =
    [...hero.rankBuckets].filter((bucket) => bucket.picks > 0).sort((a, b) => b.winRate - a.winRate || b.picks - a.picks)[0] ?? null;

  return {
    strongestEdge: sortedEdges.find((matchup) => matchup.advantage > 0) ?? null,
    biggestThreat: sortedThreats.find((matchup) => matchup.advantage < 0) ?? null,
    bestRankBucket,
    sampleSize: matchups.reduce((sum, matchup) => sum + matchup.games, 0),
    itemCoverage: items.reduce((sum, item) => sum + item.count, 0),
    trendDelta,
    trendDirection: trendDirection(trendDelta),
    notes: [
      freshness === "live"
        ? "Using live OpenDota public API data."
        : freshness === "stale"
          ? "Using last cached OpenDota public API data."
          : "Using bundled sample data because no cached OpenDota data is available.",
      "Patch-specific win rates, talent stats, and credentialed provider data remain future scoped work.",
    ],
  };
}

function fallbackHeroDetail(heroId: string | number): HeroDetail {
  const requestedHeroId = Number(heroId);
  const hero = fallbackHeroes.find((candidate) => candidate.id === requestedHeroId) ?? fallbackOverview.selectedHero;
  const matchups = fallbackMatchupsForHero(hero);
  const items = fallbackOverview.items;

  return {
    generatedAt: new Date().toISOString(),
    dataFreshness: "sample",
    dataLastUpdated: null,
    patchVersion: fallbackOverview.patchVersion,
    hero,
    matchups,
    items,
    insight: toHeroInsight(hero, matchups, items, "sample"),
    sources: fallbackOverview.sources,
  };
}

function topItemsForPhase(
  phase: ItemTiming["phase"],
  bucket: Record<string, number> | undefined,
  constants: Record<string, OpenDotaItem>,
): ItemTiming[] {
  if (!bucket) {
    return [];
  }

  const itemsById = new Map<number, OpenDotaItem>();
  Object.values(constants).forEach((item) => {
    if (typeof item.id === "number") {
      itemsById.set(item.id, item);
    }
  });

  return Object.entries(bucket)
    .map(([id, count]) => {
      const itemId = Number(id);
      const item = itemsById.get(itemId);
      return {
        phase,
        itemId,
        name: item?.dname ?? `Item ${itemId}`,
        count,
        cost: typeof item?.cost === "number" ? item.cost : null,
        imageUrl: assetUrl(item?.img),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function toItemTimings(
  popularity: {
    start_game_items?: Record<string, number>;
    early_game_items?: Record<string, number>;
    mid_game_items?: Record<string, number>;
    late_game_items?: Record<string, number>;
  },
  constants: Record<string, OpenDotaItem>,
): ItemTiming[] {
  return [
    ...topItemsForPhase("Start", popularity.start_game_items, constants),
    ...topItemsForPhase("Early", popularity.early_game_items, constants),
    ...topItemsForPhase("Mid", popularity.mid_game_items, constants),
    ...topItemsForPhase("Late", popularity.late_game_items, constants),
  ];
}

function isRadiantSlot(playerSlot: number): boolean {
  return playerSlot < 128;
}

function toPlayerProfile(
  accountId: string,
  matches: OpenDotaRecentMatch[],
  heroMap: Map<number, HeroSummary>,
): PlayerProfile {
  const recentMatches: PlayerMatch[] = matches.slice(0, 12).map((match) => {
    const isRadiant = isRadiantSlot(match.player_slot);
    const won = isRadiant ? match.radiant_win : !match.radiant_win;
    return {
      matchId: match.match_id,
      heroId: match.hero_id,
      heroName: resolveHeroName(heroMap, match.hero_id),
      result: won ? "Win" : "Loss",
      duration: match.duration,
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      gpm: match.gold_per_min,
      xpm: match.xp_per_min,
      heroDamage: match.hero_damage,
      towerDamage: match.tower_damage,
      startTime: match.start_time,
      averageRank: match.average_rank ?? null,
    };
  });

  const wins = recentMatches.filter((match) => match.result === "Win").length;
  const totalDeaths = recentMatches.reduce((sum, match) => sum + Math.max(1, match.deaths), 0);
  const kdaNumerator = recentMatches.reduce((sum, match) => sum + match.kills + match.assists, 0);
  const byHero = new Map<number, { heroName: string; matches: number; wins: number }>();

  recentMatches.forEach((match) => {
    const existing = byHero.get(match.heroId) ?? {
      heroName: match.heroName,
      matches: 0,
      wins: 0,
    };
    existing.matches += 1;
    existing.wins += match.result === "Win" ? 1 : 0;
    byHero.set(match.heroId, existing);
  });

  return {
    accountId,
    recentMatches,
    winRate: ratio(wins, recentMatches.length),
    avgKda: recentMatches.length > 0 ? kdaNumerator / totalDeaths : 0,
    avgGpm: average(recentMatches.map((match) => match.gpm)),
    avgXpm: average(recentMatches.map((match) => match.xpm)),
    signatureHeroes: [...byHero.entries()]
      .map(([heroId, value]) => ({
        heroId,
        heroName: value.heroName,
        matches: value.matches,
        winRate: ratio(value.wins, value.matches),
      }))
      .sort((a, b) => b.matches - a.matches || b.winRate - a.winRate)
      .slice(0, 4),
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sideFromTeam(team?: number): MatchEvent["side"] {
  if (team === 2) {
    return "Radiant";
  }
  if (team === 3) {
    return "Dire";
  }
  return "Neutral";
}

function formatObjective(objective: OpenDotaObjective): string {
  const readableType = (objective.type ?? "event").replace(/^CHAT_MESSAGE_/, "").replace(/_/g, " ").toLowerCase();
  if (objective.key) {
    return `${readableType}: ${objective.key.replace("npc_dota_", "").replace(/_/g, " ")}`;
  }
  return readableType;
}

function sideFromPlayerSlot(playerSlot?: number): MapPoint["side"] {
  if (typeof playerSlot !== "number") {
    return "Neutral";
  }
  return isRadiantSlot(playerSlot) ? "Radiant" : "Dire";
}

function clampPercent(value: number): number {
  return Math.max(2, Math.min(98, value));
}

function coordinateToPercent(value?: number): number {
  if (typeof value !== "number") {
    return 50;
  }
  return clampPercent((value / 255) * 100);
}

function wardPoint(
  log: OpenDotaWardLog,
  player: OpenDotaPlayer,
  kind: MapPoint["kind"],
  heroMap: Map<number, HeroSummary>,
): MapPoint {
  return {
    x: coordinateToPercent(log.x),
    y: 100 - coordinateToPercent(log.y),
    kind,
    side: sideFromPlayerSlot(player.player_slot),
    time: Number(log.time ?? 0),
    intensity: kind === "Observer" ? 0.9 : 0.68,
    label: `${resolveHeroName(heroMap, Number(player.hero_id ?? 0))} ${kind.toLowerCase()}`,
  };
}

function laneHeatPoints(player: OpenDotaPlayer, heroMap: Map<number, HeroSummary>): MapPoint[] {
  const lanePos = player.lane_pos;
  if (!lanePos) {
    return [];
  }

  const points: MapPoint[] = [];
  Object.entries(lanePos).forEach(([x, ys]) => {
    Object.entries(ys).forEach(([y, intensity]) => {
      if (intensity < 4) {
        return;
      }
      points.push({
        x: coordinateToPercent(Number(x)),
        y: 100 - coordinateToPercent(Number(y)),
        kind: "Lane",
        side: sideFromPlayerSlot(player.player_slot),
        time: 0,
        intensity: Math.min(1, intensity / 28),
        label: `${resolveHeroName(heroMap, Number(player.hero_id ?? 0))} lane heat`,
      });
    });
  });

  return points;
}

function toMatchReplay(match: OpenDotaMatch, heroMap: Map<number, HeroSummary>): MatchReplay {
  const events = (match.objectives ?? [])
    .filter((objective) => typeof objective.time === "number")
    .map((objective) => ({
      time: Number(objective.time),
      label: formatObjective(objective),
      type: objective.type ?? "objective",
      side: sideFromTeam(objective.team),
    }))
    .sort((a, b) => a.time - b.time)
    .slice(0, 22);

  const mapPoints: MapPoint[] = [];
  (match.players ?? []).forEach((player) => {
    player.obs_log?.forEach((entry) => mapPoints.push(wardPoint(entry, player, "Observer", heroMap)));
    player.sen_log?.forEach((entry) => mapPoints.push(wardPoint(entry, player, "Sentry", heroMap)));
    mapPoints.push(...laneHeatPoints(player, heroMap));
  });

  const sampledMapPoints = mapPoints
    .sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "Lane" ? 1 : -1;
      }
      return b.intensity - a.intensity;
    })
    .slice(0, MAX_MATCH_POINTS);

  return {
    matchId: match.match_id,
    duration: Number(match.duration ?? 0),
    radiantWin: Boolean(match.radiant_win),
    radiantScore: Number(match.radiant_score ?? 0),
    direScore: Number(match.dire_score ?? 0),
    leagueName: match.league_name ?? null,
    events,
    mapPoints: sampledMapPoints,
    teamfights: (match.teamfights ?? [])
      .map((fight) => ({
        start: Number(fight.start ?? 0),
        end: Number(fight.end ?? 0),
        deaths: Number(fight.deaths ?? 0),
      }))
      .slice(0, 8),
  };
}

export async function getHeroMeta(): Promise<HeroSummary[]> {
  const { data: heroes } = await fetchJson<OpenDotaHero[]>("/heroStats", 600);
  return heroes
    .map(toHeroSummary)
    .filter((hero) => hero.pubPick > 0)
    .sort((a, b) => b.pubPick - a.pubPick);
}

export async function getHeroDetail(heroId: string | number): Promise<HeroDetail> {
  try {
    const requestedHeroId = Number(heroId);
    const heroMetaResult = await fetchJson<OpenDotaHero[]>("/heroStats", 600);
    const heroMeta = heroMetaResult.data
      .map(toHeroSummary)
      .filter((hero) => hero.pubPick > 0)
      .sort((a, b) => b.pubPick - a.pubPick);
    const heroMap = new Map(heroMeta.map((hero) => [hero.id, hero]));
    const hero = heroMap.get(requestedHeroId) ?? heroMeta[0] ?? fallbackOverview.selectedHero;

    const [matchupsRaw, itemPopularity, itemConstants] = await Promise.all([
      fetchJson<OpenDotaMatchup[]>(`/heroes/${hero.id}/matchups`, 900).catch(() => ({
        data: [],
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
      fetchJson<Record<string, Record<string, number>>>(`/heroes/${hero.id}/itemPopularity`, 1800).catch(() => ({
        data: {},
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
      fetchJson<Record<string, OpenDotaItem>>("/constants/items", 86_400).catch(() => ({
        data: {},
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
    ]);

    const fetchResults = [heroMetaResult, matchupsRaw, itemPopularity, itemConstants];
    const freshness = dataFreshness(fetchResults);
    const lastUpdated = oldestUpdatedAt(fetchResults);
    const matchups = toMatchups(matchupsRaw.data, hero, heroMap);
    const items = toItemTimings(itemPopularity.data, itemConstants.data);

    return {
      generatedAt: new Date().toISOString(),
      dataFreshness: freshness,
      dataLastUpdated: lastUpdated,
      patchVersion: freshness === "stale" ? `OpenDota cached hero detail from ${lastUpdated}` : "OpenDota live hero detail",
      hero,
      matchups,
      items,
      insight: toHeroInsight(hero, matchups, items, freshness),
      sources: openDotaSources(freshness, lastUpdated, "Public API for hero detail, matchups, item popularity, and current meta signals."),
    };
  } catch {
    return {
      ...fallbackHeroDetail(heroId),
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function getPlayerProfile(accountId: string, heroMap?: Map<number, HeroSummary>): Promise<PlayerProfile> {
  try {
    const heroes = heroMap ?? new Map((await getHeroMeta()).map((hero) => [hero.id, hero]));
    const { data: matches } = await fetchJson<OpenDotaRecentMatch[]>(`/players/${encodeURIComponent(accountId)}/recentMatches`, 300);
    return toPlayerProfile(accountId, matches, heroes);
  } catch {
    return { ...fallbackPlayer, accountId };
  }
}

export async function getMatchReplay(matchId: string | number, heroMap?: Map<number, HeroSummary>): Promise<MatchReplay> {
  try {
    const heroes = heroMap ?? new Map((await getHeroMeta()).map((hero) => [hero.id, hero]));
    const { data: match } = await fetchJson<OpenDotaMatch>(`/matches/${encodeURIComponent(String(matchId))}`, 3600);
    return toMatchReplay(match, heroes);
  } catch {
    return { ...fallbackMatch, matchId: Number(matchId) || fallbackMatch.matchId };
  }
}

export async function getDotaOverview(): Promise<DotaOverview> {
  try {
    const heroMetaResult = await fetchJson<OpenDotaHero[]>("/heroStats", 600);
    const heroMeta = heroMetaResult.data
      .map(toHeroSummary)
      .filter((hero) => hero.pubPick > 0)
      .sort((a, b) => b.pubPick - a.pubPick)
      .slice(0, 24);
    const heroMap = new Map(heroMeta.map((hero) => [hero.id, hero]));
    const selectedHero =
      heroMeta.find((hero) => hero.proPick >= 20 && hero.pubWinRate >= 0.5) ?? heroMeta[0] ?? fallbackOverview.selectedHero;

    const [matchupsRaw, itemPopularity, itemConstants, player, proMatchesRaw] = await Promise.all([
      fetchJson<OpenDotaMatchup[]>(`/heroes/${selectedHero.id}/matchups`, 900).catch(() => ({
        data: [],
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
      fetchJson<Record<string, Record<string, number>>>(`/heroes/${selectedHero.id}/itemPopularity`, 1800).catch(() => ({
        data: {},
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
      fetchJson<Record<string, OpenDotaItem>>("/constants/items", 86_400).catch(() => ({
        data: {},
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
      getPlayerProfile(SAMPLE_ACCOUNT_ID, heroMap),
      fetchJson<OpenDotaProMatch[]>("/proMatches", 300).catch(() => ({
        data: [],
        updatedAt: heroMetaResult.updatedAt,
        freshness: heroMetaResult.freshness,
      })),
    ]);

    const firstMatchId = proMatchesRaw.data.find((match) => match.version !== null)?.match_id ?? fallbackMatch.matchId;
    const match = await getMatchReplay(firstMatchId, heroMap);
    const fetchResults = [heroMetaResult, matchupsRaw, itemPopularity, itemConstants, proMatchesRaw];
    const freshness = dataFreshness(fetchResults);
    const lastUpdated = oldestUpdatedAt(fetchResults);

    return {
      generatedAt: new Date().toISOString(),
      dataFreshness: freshness,
      dataLastUpdated: lastUpdated,
      patchVersion: freshness === "stale" ? `OpenDota cached data from ${lastUpdated}` : `OpenDota match version ${proMatchesRaw.data.find((row) => row.version)?.version ?? "live"}`,
      selectedHero,
      heroMeta,
      matchups: toMatchups(matchupsRaw.data, selectedHero, heroMap),
      items: toItemTimings(itemPopularity.data, itemConstants.data),
      player,
      match,
      proMatches: proMatchesRaw.data.slice(0, 8).map((row) => ({
        matchId: row.match_id,
        radiantName: row.radiant_name ?? "Radiant",
        direName: row.dire_name ?? "Dire",
        radiantScore: row.radiant_score,
        direScore: row.dire_score,
        duration: row.duration,
        leagueName: row.league_name ?? "Unknown league",
      })),
      sources: openDotaSources(freshness, lastUpdated, "Public API for hero stats, player matches, parsed match events, wards, and item popularity."),
    };
  } catch {
    return {
      ...fallbackOverview,
      generatedAt: new Date().toISOString(),
    };
  }
}
