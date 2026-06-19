import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  getBuildLookupBoundary,
  listBuildLookupBoundaries,
  requiresCredentialedProviderForDistribution,
} from "../src/lib/dota/lookup-boundaries";
import { getDotaOverview, getHeroDetail, resetOpenDotaCacheForTests } from "../src/lib/dota/opendota";

type RoutePayload = unknown | Response | Error;

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  resetOpenDotaCacheForTests();
});

describe("Dota API provider contracts", () => {
  it("normalizes a live overview response shape without external credentials", async () => {
    mockOpenDota({
      "/heroStats": liveHeroes,
      "/heroes/2/matchups": [{ hero_id: 35, games_played: 120, wins: 54 }],
      "/heroes/2/itemPopularity": itemPopularity,
      "/constants/items": itemConstants,
      "/players/86745912/recentMatches": recentMatches,
      "/proMatches": proMatches,
      "/matches/9001": parsedMatch,
    });

    const overview = await getDotaOverview();

    assert.equal(overview.sources[0].name, "OpenDota");
    assert.equal(overview.sources[0].status, "live");
    assert.equal(overview.dataFreshness, "live");
    assert.match(overview.dataLastUpdated ?? "", /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(overview.selectedHero.id, 2);
    assert.equal(overview.selectedHero.name, "Axe");
    assert.equal(overview.matchups[0].heroName, "Sniper");
    assert.equal(overview.items[0].name, "Iron Branch");
    assert.equal(overview.player.accountId, "86745912");
    assert.equal(overview.match.matchId, 9001);
    assert.equal(overview.proMatches[0].leagueName, "Contract Test League");
  });

  it("normalizes a live hero detail response shape", async () => {
    mockOpenDota({
      "/heroStats": liveHeroes,
      "/heroes/2/matchups": [{ hero_id: 35, games_played: 88, wins: 39 }],
      "/heroes/2/itemPopularity": itemPopularity,
      "/constants/items": itemConstants,
    });

    const detail = await getHeroDetail(2);

    assert.equal(detail.sources[0].status, "live");
    assert.equal(detail.dataFreshness, "live");
    assert.match(detail.dataLastUpdated ?? "", /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(detail.hero.id, 2);
    assert.equal(detail.hero.name, "Axe");
    assert.equal(detail.matchups[0].heroName, "Sniper");
    assert.equal(detail.items[0].phase, "Start");
    assert.ok(detail.insight.sampleSize > 0);
    assert.match(detail.insight.notes.join(" "), /OpenDota public API data/);
  });

  it("uses stale cached OpenDota data before bundled sample data", async () => {
    mockOpenDota({
      "/heroStats": liveHeroes,
      "/heroes/2/matchups": [{ hero_id: 35, games_played: 88, wins: 39 }],
      "/heroes/2/itemPopularity": itemPopularity,
      "/constants/items": itemConstants,
    });

    const liveDetail = await getHeroDetail(2);

    mockOpenDota({
      "/heroStats": new Response("service unavailable", { status: 503 }),
      "/heroes/2/matchups": new Response("service unavailable", { status: 503 }),
      "/heroes/2/itemPopularity": new Response("service unavailable", { status: 503 }),
      "/constants/items": new Response("service unavailable", { status: 503 }),
    });

    const staleDetail = await getHeroDetail(2);

    assert.equal(staleDetail.sources[0].status, "stale");
    assert.equal(staleDetail.dataFreshness, "stale");
    assert.equal(staleDetail.dataLastUpdated, liveDetail.dataLastUpdated);
    assert.equal(staleDetail.hero.name, "Axe");
    assert.equal(staleDetail.items[0].name, "Iron Branch");
    assert.match(staleDetail.sources[0].note, /last cached OpenDota data/i);
    assert.match(staleDetail.insight.notes.join(" "), /last cached OpenDota public API data/);
  });

  it("uses bundled sample data only when no OpenDota cache exists", async () => {
    mockOpenDota({
      "/heroStats": new Response("service unavailable", { status: 503 }),
    });

    const overview = await getDotaOverview();
    const heroDetail = await getHeroDetail(35);

    assert.equal(overview.sources[0].status, "sample");
    assert.equal(overview.dataFreshness, "sample");
    assert.equal(overview.dataLastUpdated, null);
    assert.equal(overview.selectedHero.name, "Axe");
    assert.equal(heroDetail.sources[0].status, "sample");
    assert.equal(heroDetail.dataFreshness, "sample");
    assert.equal(heroDetail.dataLastUpdated, null);
    assert.equal(heroDetail.hero.id, 35);
    assert.match(heroDetail.insight.notes.join(" "), /bundled sample data/);
  });
});

describe("Build lookup source boundaries", () => {
  it("keeps item lookup limited to public OpenDota data and non-authoritative fallback", () => {
    const items = getBuildLookupBoundary("items");

    assert.match(items.publicDataToday.join(" "), /\/constants\/items/);
    assert.match(items.publicDataToday.join(" "), /itemPopularity/);
    assert.match(items.fallbackPolicy, /not current-match or current-patch truth/);
    assert.ok(requiresCredentialedProviderForDistribution("items"));
  });

  it("does not claim public ability or talent distribution support", () => {
    const abilities = getBuildLookupBoundary("abilities");
    const talents = getBuildLookupBoundary("talents");

    assert.match(abilities.currentProductUse, /not surfaced yet/);
    assert.match(abilities.credentialedProviderNeededFor.join(" "), /skill build timelines/);
    assert.match(talents.currentProductUse, /does not claim public talent pick or win distribution/);
    assert.match(talents.credentialedProviderNeededFor.join(" "), /Talent pick and win distributions/);
  });

  it("keeps credentialed providers out of the current boundary work", () => {
    const boundaries = listBuildLookupBoundaries();

    assert.deepEqual(
      boundaries.map((boundary) => boundary.domain),
      ["items", "abilities", "talents"],
    );
    assert.ok(
      boundaries.every((boundary) =>
        boundary.explicitNonGoals.some((goal) => /No (Steam|STRATZ|paid|credentialed|private|production)/i.test(goal)),
      ),
    );
  });
});

function mockOpenDota(routes: Record<string, RoutePayload>): void {
  globalThis.fetch = async (input) => {
    const key = routeKey(input);
    const payload = routes[key];

    if (payload instanceof Error) {
      throw payload;
    }

    if (payload instanceof Response) {
      return payload;
    }

    if (payload === undefined) {
      throw new Error(`Unexpected OpenDota request: ${key}`);
    }

    return Response.json(payload);
  };
}

function routeKey(input: Parameters<typeof fetch>[0]): string {
  const url =
    typeof input === "string"
      ? new URL(input)
      : input instanceof URL
        ? input
        : new URL(input.url);

  return url.pathname.replace(/^\/api/, "") || "/";
}

const liveHeroes = [
  {
    id: 2,
    name: "npc_dota_hero_axe",
    localized_name: "Axe",
    primary_attr: "str",
    attack_type: "Melee",
    roles: ["Initiator", "Durable"],
    img: "/apps/dota2/images/dota_react/heroes/axe.png",
    icon: "/apps/dota2/images/dota_react/heroes/icons/axe.png",
    pub_pick: 1000,
    pub_win: 540,
    pub_pick_trend: [120, 125, 130, 135, 140, 145, 150],
    pub_win_trend: [62, 64, 68, 72, 76, 79, 83],
    pro_pick: 25,
    pro_win: 14,
    pro_ban: 18,
    "1_pick": 110,
    "1_win": 58,
    "2_pick": 120,
    "2_win": 63,
    "3_pick": 130,
    "3_win": 69,
    "4_pick": 140,
    "4_win": 75,
    "5_pick": 150,
    "5_win": 82,
    "6_pick": 160,
    "6_win": 89,
    "7_pick": 170,
    "7_win": 96,
  },
  {
    id: 35,
    name: "npc_dota_hero_sniper",
    localized_name: "Sniper",
    primary_attr: "agi",
    attack_type: "Ranged",
    roles: ["Carry", "Nuker"],
    img: "/apps/dota2/images/dota_react/heroes/sniper.png",
    icon: "/apps/dota2/images/dota_react/heroes/icons/sniper.png",
    pub_pick: 760,
    pub_win: 380,
    pub_pick_trend: [90, 91, 92, 93, 94, 95, 96],
    pub_win_trend: [43, 44, 45, 46, 47, 48, 49],
    pro_pick: 9,
    pro_win: 4,
    pro_ban: 5,
  },
];

const itemPopularity = {
  start_game_items: { "1": 60 },
  early_game_items: { "50": 44 },
  mid_game_items: { "145": 31 },
  late_game_items: { "160": 12 },
};

const itemConstants = {
  branches: { id: 1, dname: "Iron Branch", img: "/apps/dota2/images/dota_react/items/branches.png", cost: 50 },
  blink: { id: 50, dname: "Blink Dagger", img: "/apps/dota2/images/dota_react/items/blink.png", cost: 2250 },
  bfury: { id: 145, dname: "Battle Fury", img: "/apps/dota2/images/dota_react/items/bfury.png", cost: 4100 },
  manta: { id: 160, dname: "Manta Style", img: "/apps/dota2/images/dota_react/items/manta.png", cost: 4650 },
};

const recentMatches = [
  {
    match_id: 9001,
    hero_id: 2,
    radiant_win: true,
    player_slot: 0,
    duration: 1880,
    kills: 9,
    deaths: 2,
    assists: 16,
    gold_per_min: 530,
    xp_per_min: 642,
    hero_damage: 18000,
    tower_damage: 900,
    start_time: 1781740000,
    average_rank: 54,
  },
];

const proMatches = [
  {
    match_id: 9001,
    duration: 1880,
    radiant_name: "Radiant Testers",
    dire_name: "Dire Testers",
    league_name: "Contract Test League",
    radiant_score: 28,
    dire_score: 19,
    version: 72,
  },
];

const parsedMatch = {
  match_id: 9001,
  duration: 1880,
  radiant_win: true,
  radiant_score: 28,
  dire_score: 19,
  league_name: "Contract Test League",
  objectives: [
    { time: 105, type: "CHAT_MESSAGE_FIRSTBLOOD", team: 2, key: "npc_dota_hero_axe" },
    { time: 620, type: "CHAT_MESSAGE_TOWER_KILL", team: 3, key: "npc_dota_badguys_tower1_mid" },
  ],
  teamfights: [{ start: 540, end: 590, deaths: 3 }],
  players: [
    {
      player_slot: 0,
      hero_id: 2,
      obs_log: [{ time: 300, x: 120, y: 145 }],
      sen_log: [{ time: 420, x: 140, y: 122 }],
      lane_pos: { "120": { "145": 8 } },
    },
  ],
};
