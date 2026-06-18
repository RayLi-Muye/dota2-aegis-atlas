"use client";

import Image from "next/image";
import {
  Activity,
  BarChart3,
  Clock3,
  Crosshair,
  Database,
  Eye,
  GitBranch,
  Map,
  Radar,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import type { DotaOverview, HeroDetail, HeroDetailInsight, MatchReplay, PlayerProfile } from "@/lib/dota/types";

type DotaDashboardProps = {
  initialData: DotaOverview;
};

const numberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function percent(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "-";
  }
  return `${(value * 100).toFixed(1)}%`;
}

function integer(value: number): string {
  return numberFormatter.format(Math.round(value));
}

function time(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function sideClass(side: "Radiant" | "Dire" | "Neutral") {
  if (side === "Radiant") {
    return "text-emerald-300";
  }
  if (side === "Dire") {
    return "text-rose-300";
  }
  return "text-amber-200";
}

function deltaPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}pp`;
}

function buildClientHeroInsight(
  hero: DotaOverview["selectedHero"],
  matchups: DotaOverview["matchups"],
  items: DotaOverview["items"],
): HeroDetailInsight {
  const trendDelta = (hero.trend.at(-1)?.winRate ?? hero.pubWinRate) - (hero.trend[0]?.winRate ?? hero.pubWinRate);
  const strongestEdge = [...matchups].sort((a, b) => b.advantage - a.advantage).find((matchup) => matchup.advantage > 0) ?? null;
  const biggestThreat = [...matchups].sort((a, b) => a.advantage - b.advantage).find((matchup) => matchup.advantage < 0) ?? null;
  const bestRankBucket =
    [...hero.rankBuckets].filter((bucket) => bucket.picks > 0).sort((a, b) => b.winRate - a.winRate || b.picks - a.picks)[0] ?? null;

  return {
    strongestEdge,
    biggestThreat,
    bestRankBucket,
    sampleSize: matchups.reduce((sum, matchup) => sum + matchup.games, 0),
    itemCoverage: items.reduce((sum, item) => sum + item.count, 0),
    trendDelta,
    trendDirection: trendDelta > 0.002 ? "up" : trendDelta < -0.002 ? "down" : "flat",
    notes: ["OpenDota public or bundled fallback data only.", "Patch win rates, talents, and credentialed providers remain roadmap work."],
  };
}

export function DotaDashboard({ initialData }: DotaDashboardProps) {
  const [data, setData] = useState(initialData);
  const [playerQuery, setPlayerQuery] = useState(initialData.player.accountId);
  const [matchQuery, setMatchQuery] = useState(String(initialData.match.matchId));
  const [heroInsight, setHeroInsight] = useState(() =>
    buildClientHeroInsight(initialData.selectedHero, initialData.matchups, initialData.items),
  );
  const [notice, setNotice] = useState("OpenDota live feed loaded");
  const [isPending, startTransition] = useTransition();

  const topWinRate = useMemo(
    () =>
      [...data.heroMeta]
        .filter((hero) => hero.pubPick > 50_000)
        .sort((a, b) => b.pubWinRate - a.pubWinRate)
        .slice(0, 6),
    [data.heroMeta],
  );

  const updateHero = (heroId: number) => {
    startTransition(async () => {
      const response = await fetch(`/api/dota/hero/${encodeURIComponent(String(heroId))}`);
      const detail = (await response.json()) as HeroDetail;
      setData((current) => ({
        ...current,
        generatedAt: detail.generatedAt,
        patchVersion: detail.patchVersion,
        selectedHero: detail.hero,
        matchups: detail.matchups,
        items: detail.items,
        sources: detail.sources,
      }));
      setHeroInsight(detail.insight);
      setNotice(`${detail.hero.name} detail loaded`);
    });
  };

  const updatePlayer = () => {
    const accountId = playerQuery.trim();
    if (!accountId) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/dota/player/${encodeURIComponent(accountId)}`);
      const player = (await response.json()) as PlayerProfile;
      setData((current) => ({ ...current, player }));
      setNotice(`Player ${accountId} refreshed`);
    });
  };

  const updateMatch = () => {
    const matchId = matchQuery.trim();
    if (!matchId) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/dota/match/${encodeURIComponent(matchId)}`);
      const match = (await response.json()) as MatchReplay;
      setData((current) => ({ ...current, match }));
      setNotice(`Match ${matchId} parsed`);
    });
  };

  const refreshOverview = () => {
    startTransition(async () => {
      const response = await fetch("/api/dota/overview");
      const overview = (await response.json()) as DotaOverview;
      setData(overview);
      setPlayerQuery(overview.player.accountId);
      setMatchQuery(String(overview.match.matchId));
      setHeroInsight(buildClientHeroInsight(overview.selectedHero, overview.matchups, overview.items));
      setNotice("Overview refreshed from serverless route");
    });
  };

  return (
    <main className="min-h-screen bg-[#07100f] text-slate-100">
      <div className="grid min-h-screen max-w-full grid-cols-1 overflow-x-hidden xl:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar sources={data.sources} />
        <section className="min-w-0 max-w-full border-l border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(18,117,92,0.18),transparent_34%),linear-gradient(135deg,#0a1312_0%,#101414_48%,#130d0d_100%)]">
          <header className="sticky top-0 z-20 border-b border-white/8 bg-[#07100f]/82 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-300/10">
                  <Radar className="size-5 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-normal text-white">Aegis Atlas</h1>
                  <p className="hidden truncate text-sm text-slate-400 sm:block">
                    Hero meta, counters, player form, match replay nodes, and ward heat.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:w-[760px]">
                <SearchBox
                  label="Steam account ID"
                  value={playerQuery}
                  onChange={setPlayerQuery}
                  onSubmit={updatePlayer}
                  icon={<UserRound className="size-4" />}
                />
                <SearchBox
                  label="Match ID"
                  value={matchQuery}
                  onChange={setMatchQuery}
                  onSubmit={updateMatch}
                  icon={<GitBranch className="size-4" />}
                />
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/16"
                  onClick={refreshOverview}
                  type="button"
                >
                  <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-[1540px] flex-col gap-4 overflow-x-hidden px-4 py-4 md:px-6 md:py-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.48fr)_minmax(360px,0.72fr)]">
              <HeroMetaPanel
                data={data}
                isPending={isPending}
                onSelectHero={updateHero}
                selectedHeroId={data.selectedHero.id}
                topWinRate={topWinRate}
              />
              <div className="grid gap-4">
                <HeroDetailPanel hero={data.selectedHero} insight={heroInsight} />
                <PlayerPanel player={data.player} />
              </div>
            </div>

            <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(420px,0.95fr)_minmax(0,1.05fr)]">
              <MatchupPanel data={data} />
              <MapPanel match={data.match} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.82fr)]">
              <TimelinePanel match={data.match} />
              <ItemsPanel data={data} />
            </div>

            <footer className="flex flex-col gap-2 border-t border-white/8 py-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
              <span>
                {notice} · generated {formatDate(data.generatedAt)} · {data.patchVersion}
              </span>
              <span>Serverless API routes: /api/dota/overview, /api/dota/hero/:id, /api/dota/player/:id, /api/dota/match/:id</span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ sources }: { sources: DotaOverview["sources"] }) {
  const nav = [
    { label: "Hero Meta", icon: BarChart3 },
    { label: "Counters", icon: Swords },
    { label: "Player Form", icon: UserRound },
    { label: "Match Replay", icon: GitBranch },
    { label: "Ward Heat", icon: Eye },
    { label: "Items & Talents", icon: Sparkles },
  ];

  return (
    <aside className="hidden bg-[#08100f] px-4 py-5 xl:block">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-300 to-cyan-300 text-slate-950">
          <Shield className="size-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Aegis Atlas</p>
          <p className="text-xs text-slate-500">Dota2 intelligence</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {nav.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm transition ${
                index === 0
                  ? "bg-emerald-300/12 text-emerald-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
              key={item.label}
              type="button"
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-white/8 pt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Sources</p>
        <div className="space-y-3">
          {sources.map((source) => (
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3" key={source.name}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-slate-200">{source.name}</span>
                <span
                  className={`rounded-md px-2 py-1 text-[11px] font-medium ${
                    source.status === "live"
                      ? "bg-emerald-300/12 text-emerald-200"
                      : source.status === "fallback"
                        ? "bg-amber-300/12 text-amber-200"
                        : "bg-slate-400/10 text-slate-400"
                  }`}
                >
                  {source.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{source.note}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SearchBox({
  label,
  value,
  onChange,
  onSubmit,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  icon: React.ReactNode;
}) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-slate-400 focus-within:border-emerald-300/50">
      {icon}
      <span className="sr-only">{label}</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSubmit();
          }
        }}
        placeholder={label}
        value={value}
      />
      <button
        className="rounded-md bg-white/8 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/14"
        onClick={onSubmit}
        type="button"
      >
        Run
      </button>
    </label>
  );
}

function Panel({
  title,
  action,
  children,
  icon,
}: {
  title: string;
  action?: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/8 bg-[#0d1715]/88 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-white/6 text-emerald-200">{icon}</div>
          <h2 className="truncate text-sm font-semibold text-slate-100">{title}</h2>
        </div>
        {action ? <p className="hidden truncate text-xs text-slate-500 sm:block">{action}</p> : null}
      </div>
      {children}
    </section>
  );
}

function HeroMetaPanel({
  data,
  isPending,
  onSelectHero,
  selectedHeroId,
  topWinRate,
}: {
  data: DotaOverview;
  isPending: boolean;
  onSelectHero: (heroId: number) => void;
  selectedHeroId: number;
  topWinRate: DotaOverview["heroMeta"];
}) {
  return (
    <Panel icon={<Activity className="size-4" />} title="Hero Meta" action="Current public and pro signal">
      <div className="grid min-w-0 gap-0 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r">
          <div className="relative overflow-hidden rounded-lg border border-emerald-300/18 bg-emerald-300/[0.045] p-3 sm:p-4">
            <div className="absolute right-0 top-0 h-32 w-32 bg-emerald-300/10 blur-3xl" />
            <div className="relative flex items-start gap-3">
              <Image
                alt={data.selectedHero.name}
                className="rounded-lg object-cover"
                height={64}
                src={data.selectedHero.imageUrl}
                width={112}
              />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">Featured hero</p>
                <h3 className="mt-1 truncate text-2xl font-semibold text-white">{data.selectedHero.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{data.selectedHero.roles.slice(0, 3).join(" / ")}</p>
              </div>
            </div>
            <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Metric label="Pick" value={integer(data.selectedHero.pubPick)} />
              <Metric label="Win" value={percent(data.selectedHero.pubWinRate)} tone="green" />
              <Metric label="Pro" value={integer(data.selectedHero.proPick)} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {topWinRate.map((hero) => (
              <div className="flex items-center gap-3" key={hero.id}>
                <Image alt={hero.name} className="rounded-md" height={34} src={hero.iconUrl} width={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-slate-200">{hero.name}</span>
                    <span className="font-medium text-emerald-200">{percent(hero.pubWinRate)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.min(100, hero.pubWinRate * 145)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-500">
              <tr className="border-b border-white/8">
                <th className="px-4 py-3 font-medium">Hero</th>
                <th className="px-3 py-3 font-medium">Attr</th>
                <th className="px-3 py-3 font-medium">Pub pick</th>
                <th className="px-3 py-3 font-medium">Pub win</th>
                <th className="px-3 py-3 font-medium">Pro pick</th>
                <th className="px-3 py-3 font-medium">7d trend</th>
                <th className="px-4 py-3 text-right font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {data.heroMeta.slice(0, 10).map((hero) => {
                const lastTrend = hero.trend.at(-1)?.winRate ?? hero.pubWinRate;
                const selected = hero.id === selectedHeroId;
                return (
                  <tr className={`border-b border-white/6 last:border-b-0 ${selected ? "bg-emerald-300/[0.045]" : ""}`} key={hero.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Image alt={hero.name} className="rounded-md" height={30} src={hero.iconUrl} width={30} />
                        <span className="font-medium text-slate-100">{hero.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{hero.primaryAttr.toUpperCase()}</td>
                    <td className="px-3 py-3 text-slate-300">{integer(hero.pubPick)}</td>
                    <td className="px-3 py-3 text-emerald-200">{percent(hero.pubWinRate)}</td>
                    <td className="px-3 py-3 text-slate-300">{integer(hero.proPick)}</td>
                    <td className="px-3 py-3">
                      <MiniTrend points={hero.trend.map((point) => point.winRate)} tone={lastTrend >= hero.pubWinRate ? "green" : "red"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        aria-label={`Inspect ${hero.name}`}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${
                          selected
                            ? "border-emerald-300/30 bg-emerald-300/14 text-emerald-100"
                            : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                        }`}
                        disabled={isPending || selected}
                        onClick={() => onSelectHero(hero.id)}
                        type="button"
                      >
                        <Crosshair className="size-3.5" />
                        {selected ? "Open" : "Inspect"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function HeroDetailPanel({ hero, insight }: { hero: DotaOverview["selectedHero"]; insight: HeroDetailInsight }) {
  const trendTone = insight.trendDirection === "down" ? "red" : insight.trendDirection === "up" ? "green" : "slate";

  return (
    <Panel icon={<Crosshair className="size-4" />} title="Hero Detail" action="OpenDota public slice">
      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <Image alt={hero.name} className="rounded-md" height={38} src={hero.iconUrl} width={38} />
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{hero.name}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {hero.attackType} · {hero.primaryAttr.toUpperCase()} · {hero.roles.slice(0, 3).join(" / ")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Metric label="Trend" value={deltaPercent(insight.trendDelta)} tone={trendTone} />
          <Metric label="Samples" value={integer(insight.sampleSize)} />
          <Metric label="Best rank" value={insight.bestRankBucket ? insight.bestRankBucket.label : "-"} tone="green" />
          <Metric label="Items" value={integer(insight.itemCoverage)} />
        </div>

        <div className="space-y-3 text-sm">
          <InsightRow
            label="Strongest edge"
            tone="green"
            value={insight.strongestEdge ? `${insight.strongestEdge.heroName} · ${deltaPercent(insight.strongestEdge.advantage)}` : "-"}
          />
          <InsightRow
            label="Biggest threat"
            tone="red"
            value={insight.biggestThreat ? `${insight.biggestThreat.heroName} · ${deltaPercent(insight.biggestThreat.advantage)}` : "-"}
          />
        </div>

        <div className="border-t border-white/8 pt-3">
          {insight.notes.map((note) => (
            <p className="text-xs leading-5 text-slate-500" key={note}>
              {note}
            </p>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function InsightRow({ label, tone, value }: { label: string; tone: "green" | "red"; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`truncate text-right font-medium ${tone === "green" ? "text-emerald-200" : "text-rose-200"}`}>{value}</span>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "green" | "red" | "slate" }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "green" ? "text-emerald-200" : tone === "red" ? "text-rose-200" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function MiniTrend({ points, tone }: { points: number[]; tone: "green" | "red" }) {
  const safePoints = points.length > 1 ? points : [0.48, 0.5, 0.49, 0.51, 0.5, 0.52, 0.51];
  const d = safePoints
    .map((point, index) => {
      const x = (index / Math.max(1, safePoints.length - 1)) * 92 + 4;
      const y = 36 - Math.max(0, Math.min(1, (point - 0.42) / 0.18)) * 28;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="h-10 w-28" viewBox="0 0 100 42" role="img" aria-label="Seven day win-rate trend">
      <path d="M4 36 H96" stroke="rgba(255,255,255,0.08)" />
      <path d={d} fill="none" stroke={tone === "green" ? "#6ee7b7" : "#fda4af"} strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

function PlayerPanel({ player }: { player: PlayerProfile }) {
  return (
    <Panel icon={<UserRound className="size-4" />} title="Player Form" action={`Account ${player.accountId}`}>
      <div className="grid grid-cols-2 gap-3 p-4">
        <Metric label="Recent win" value={percent(player.winRate)} tone={player.winRate >= 0.5 ? "green" : "red"} />
        <Metric label="Avg KDA" value={player.avgKda.toFixed(2)} />
        <Metric label="Avg GPM" value={integer(player.avgGpm)} />
        <Metric label="Avg XPM" value={integer(player.avgXpm)} />
      </div>
      <div className="border-t border-white/8 px-4 py-3">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Signature heroes</p>
        <div className="space-y-3">
          {player.signatureHeroes.map((hero) => (
            <div className="grid grid-cols-[1fr_auto] gap-3 text-sm" key={hero.heroId}>
              <span className="truncate text-slate-200">{hero.heroName}</span>
              <span className="text-emerald-200">
                {hero.matches} games · {percent(hero.winRate)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="max-h-[278px] overflow-auto border-t border-white/8">
        {player.recentMatches.map((match) => (
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/6 px-4 py-3 text-sm last:border-b-0" key={match.matchId}>
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-100">{match.heroName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {match.kills}/{match.deaths}/{match.assists} · {time(match.duration)}
              </p>
            </div>
            <div className="text-right">
              <p className={match.result === "Win" ? "text-emerald-200" : "text-rose-200"}>{match.result}</p>
              <p className="mt-1 text-xs text-slate-500">
                {match.gpm} GPM · {match.xpm} XPM
              </p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function MatchupPanel({ data }: { data: DotaOverview }) {
  return (
    <Panel icon={<Crosshair className="size-4" />} title={`${data.selectedHero.name} Counter Matrix`} action="Lower enemy win rate is better">
      <div className="space-y-2 p-4">
        {data.matchups.slice(0, 10).map((matchup) => {
          const difficult = matchup.winRate > data.selectedHero.pubWinRate;
          return (
            <div className="grid grid-cols-[minmax(120px,1fr)_92px_96px] items-center gap-3" key={matchup.heroId}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">{matchup.heroName}</p>
                <p className="text-xs text-slate-500">{integer(matchup.games)} sampled games</p>
              </div>
              <div className="h-2 rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full ${difficult ? "bg-rose-300" : "bg-emerald-300"}`}
                  style={{ width: `${Math.min(100, Math.max(8, matchup.winRate * 120))}%` }}
                />
              </div>
              <div className="text-right text-sm">
                <p className={difficult ? "text-rose-200" : "text-emerald-200"}>{percent(matchup.winRate)}</p>
                <p className="text-xs text-slate-500">{difficult ? "threat" : "edge"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function MapPanel({ match }: { match: MatchReplay }) {
  return (
    <Panel icon={<Map className="size-4" />} title="Map Heat & Vision" action={`Match ${match.matchId}`}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="p-4">
          <div className="relative aspect-[1.35] overflow-hidden rounded-lg border border-white/10 bg-[#101a16]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),transparent_46%,rgba(244,63,94,0.15)),radial-gradient(circle_at_22%_76%,rgba(52,211,153,0.24),transparent_18%),radial-gradient(circle_at_76%_22%,rgba(251,113,133,0.2),transparent_19%)]" />
            <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 100 74" preserveAspectRatio="none">
              <path d="M8 66 C28 50 40 42 92 8" fill="none" stroke="rgba(125,211,252,0.28)" strokeWidth="1.6" />
              <path d="M10 15 C22 22 36 35 50 38 C64 41 76 53 89 65" fill="none" stroke="rgba(125,211,252,0.18)" strokeWidth="1.2" />
              <path d="M18 57 L42 43 L55 31 L79 18" fill="none" stroke="rgba(255,255,255,0.16)" strokeDasharray="2 4" />
              <circle cx="23" cy="56" fill="rgba(52,211,153,0.28)" r="10" />
              <circle cx="77" cy="18" fill="rgba(251,113,133,0.24)" r="10" />
            </svg>
            {match.mapPoints.map((point, index) => (
              <span
                className={`absolute rounded-full ${
                  point.kind === "Observer"
                    ? "border border-cyan-100 bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]"
                    : point.kind === "Sentry"
                      ? "border border-amber-100 bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.72)]"
                      : point.kind === "Death"
                        ? "bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.72)]"
                        : "bg-emerald-300/36"
                }`}
                key={`${point.kind}-${point.x}-${point.y}-${index}`}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  height: point.kind === "Lane" ? `${8 + point.intensity * 22}px` : "10px",
                  opacity: point.kind === "Lane" ? 0.22 + point.intensity * 0.36 : 0.88,
                  transform: "translate(-50%, -50%)",
                  width: point.kind === "Lane" ? `${8 + point.intensity * 22}px` : "10px",
                }}
                title={`${point.label} at ${time(point.time)}`}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-white/8 p-4 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Radiant" value={String(match.radiantScore)} tone={match.radiantWin ? "green" : "red"} />
            <Metric label="Dire" value={String(match.direScore)} tone={match.radiantWin ? "red" : "green"} />
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <Legend color="bg-cyan-300" label="Observer wards" />
            <Legend color="bg-amber-300" label="Sentry wards" />
            <Legend color="bg-rose-400" label="Deaths / objective fights" />
            <Legend color="bg-emerald-300/50" label="Lane heat samples" />
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            Points are parsed from OpenDota ward logs and lane position samples. The map is an abstract tactical surface, not an official Dota map image.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2.5 rounded-full ${color}`} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function TimelinePanel({ match }: { match: MatchReplay }) {
  return (
    <Panel icon={<Clock3 className="size-4" />} title="Replay Event Nodes" action={`${time(match.duration)} duration`}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="max-h-[360px] overflow-auto p-4">
          <div className="relative space-y-4 pl-5 before:absolute before:bottom-2 before:left-1.5 before:top-2 before:w-px before:bg-white/10">
            {match.events.map((event, index) => (
              <div className="relative" key={`${event.time}-${event.type}-${index}`}>
                <span className={`absolute -left-[18px] top-1 size-3 rounded-full ${event.side === "Radiant" ? "bg-emerald-300" : event.side === "Dire" ? "bg-rose-300" : "bg-amber-300"}`} />
                <div className="grid grid-cols-[58px_minmax(0,1fr)] gap-3">
                  <span className="font-mono text-xs text-slate-500">{time(event.time)}</span>
                  <div>
                    <p className={`text-sm font-medium ${sideClass(event.side)}`}>{event.side}</p>
                    <p className="mt-1 text-sm text-slate-300">{event.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-white/8 p-4 lg:border-l lg:border-t-0">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Teamfights</p>
          <div className="space-y-3">
            {match.teamfights.map((fight, index) => (
              <div className="rounded-lg border border-white/8 bg-black/16 p-3" key={`${fight.start}-${index}`}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-200">
                    {time(fight.start)} - {time(fight.end)}
                  </span>
                  <span className="text-rose-200">{fight.deaths} deaths</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (fight.end / Math.max(1, match.duration)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function ItemsPanel({ data }: { data: DotaOverview }) {
  return (
    <Panel icon={<Trophy className="size-4" />} title="Items, Skills & Talents" action={`${data.selectedHero.name} build path`}>
      <div className="grid grid-cols-2 gap-3 p-4">
        {(["Start", "Early", "Mid", "Late"] as const).map((phase) => {
          const phaseItems = data.items.filter((item) => item.phase === phase).slice(0, 3);
          return (
            <div className="rounded-lg border border-white/8 bg-black/16 p-3" key={phase}>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{phase}</p>
              <div className="space-y-2">
                {phaseItems.map((item) => (
                  <div className="flex items-center gap-2" key={`${phase}-${item.itemId}`}>
                    {item.imageUrl ? <Image alt={item.name} className="rounded" height={26} src={item.imageUrl} width={36} /> : <Database className="size-5 text-slate-500" />}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-slate-500">{integer(item.count)} samples</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/8 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <RoadmapPill title="Skills" text="OpenDota constants now; STRATZ provider planned for per-patch ability builds." />
          <RoadmapPill title="Talents" text="Token-backed provider slot for current talent win/pick distribution." />
          <RoadmapPill title="Version" text="Patch-aware endpoints will sit behind the same serverless provider interface." />
        </div>
      </div>
    </Panel>
  );
}

function RoadmapPill({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
