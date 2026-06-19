export type RankBucket = {
  label: string;
  picks: number;
  wins: number;
  winRate: number;
};

export type TrendPoint = {
  label: string;
  picks: number;
  wins: number;
  winRate: number;
};

export type HeroSummary = {
  id: number;
  slug: string;
  name: string;
  primaryAttr: "str" | "agi" | "int" | "all" | string;
  attackType: string;
  roles: string[];
  imageUrl: string;
  iconUrl: string;
  pubPick: number;
  pubWin: number;
  pubWinRate: number;
  proPick: number;
  proBan: number;
  proWinRate: number | null;
  rankBuckets: RankBucket[];
  trend: TrendPoint[];
};

export type HeroMatchup = {
  heroId: number;
  heroName: string;
  games: number;
  wins: number;
  winRate: number;
  advantage: number;
};

export type HeroDetailInsight = {
  strongestEdge: HeroMatchup | null;
  biggestThreat: HeroMatchup | null;
  bestRankBucket: RankBucket | null;
  sampleSize: number;
  itemCoverage: number;
  trendDelta: number;
  trendDirection: "up" | "down" | "flat";
  notes: string[];
};

export type ItemTiming = {
  phase: "Start" | "Early" | "Mid" | "Late";
  itemId: number;
  name: string;
  count: number;
  cost: number | null;
  imageUrl: string | null;
};

export type BuildLookupDomain = "items" | "abilities" | "talents";

export type BuildLookupBoundary = {
  domain: BuildLookupDomain;
  label: string;
  publicDataToday: string[];
  currentProductUse: string;
  fallbackPolicy: string;
  credentialedProviderNeededFor: string[];
  explicitNonGoals: string[];
};

export type BuildLookupBoundaryMap = Record<BuildLookupDomain, BuildLookupBoundary>;

export type PlayerMatch = {
  matchId: number;
  heroId: number;
  heroName: string;
  result: "Win" | "Loss";
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  heroDamage: number;
  towerDamage: number;
  startTime: number;
  averageRank: number | null;
};

export type PlayerProfile = {
  accountId: string;
  recentMatches: PlayerMatch[];
  winRate: number;
  avgKda: number;
  avgGpm: number;
  avgXpm: number;
  signatureHeroes: Array<{
    heroId: number;
    heroName: string;
    matches: number;
    winRate: number;
  }>;
};

export type MatchEvent = {
  time: number;
  label: string;
  type: string;
  side: "Radiant" | "Dire" | "Neutral";
};

export type MapPoint = {
  x: number;
  y: number;
  kind: "Observer" | "Sentry" | "Death" | "Lane";
  side: "Radiant" | "Dire" | "Neutral";
  time: number;
  intensity: number;
  label: string;
};

export type MatchReplay = {
  matchId: number;
  duration: number;
  radiantWin: boolean;
  radiantScore: number;
  direScore: number;
  leagueName: string | null;
  events: MatchEvent[];
  mapPoints: MapPoint[];
  teamfights: Array<{
    start: number;
    end: number;
    deaths: number;
  }>;
};

export type DataFreshness = "live" | "stale" | "sample";

export type DataSourceStatus = {
  name: string;
  status: DataFreshness | "optional";
  note: string;
  lastUpdated: string | null;
};

export type DotaOverview = {
  generatedAt: string;
  dataFreshness: DataFreshness;
  dataLastUpdated: string | null;
  patchVersion: string;
  selectedHero: HeroSummary;
  heroMeta: HeroSummary[];
  matchups: HeroMatchup[];
  items: ItemTiming[];
  player: PlayerProfile;
  match: MatchReplay;
  proMatches: Array<{
    matchId: number;
    radiantName: string;
    direName: string;
    radiantScore: number;
    direScore: number;
    duration: number;
    leagueName: string;
  }>;
  sources: DataSourceStatus[];
};

export type HeroDetail = {
  generatedAt: string;
  dataFreshness: DataFreshness;
  dataLastUpdated: string | null;
  patchVersion: string;
  hero: HeroSummary;
  matchups: HeroMatchup[];
  items: ItemTiming[];
  insight: HeroDetailInsight;
  sources: DataSourceStatus[];
};
