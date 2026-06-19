# Aegis Atlas

Serverless Dota2 intelligence dashboard built with Next.js App Router and public OpenDota data.

Aegis Atlas is an analyst-style workbench for exploring hero meta, matchup signals, player form, match timelines, item paths, and replay-derived map data. The baseline experience uses public OpenDota endpoints plus bundled fallback data so the app can build and demo without private credentials.

## Jump To

[What It Does](#what-it-does) |
[Who It Is For](#who-it-is-for) |
[Current Capabilities](#current-capabilities) |
[Quick Start](#quick-start) |
[Serverless API](#serverless-api) |
[Data Sources](#data-sources) |
[Local Development](#local-development) |
[Repository Map](#repository-map) |
[Roadmap](#roadmap) |
[Contributing](#contributing) |
[Safety Boundary](#safety-boundary)

## What It Does

The app presents a dense dashboard rather than a landing page. It is designed to answer questions such as:

- Which heroes are showing strong public and pro pick/win-rate signals?
- Which counters look interesting enough to inspect further?
- What does a selected hero's role, matchup, item timing, and insight profile look like?
- How has a player performed in recent public matches?
- What happened during a specific match timeline?
- Where do ward and lane-position events cluster on the map?

The project is intentionally serverless-first: UI pages and API routes live in the same Next.js app, with provider code isolated under `src/lib/dota`.

## Who It Is For

This repo is useful for:

- Dota2 players who want a local public-data dashboard;
- product reviewers evaluating a Dota analytics MVP;
- engineers reviewing provider boundaries, fallback data, and serverless API design;
- agents or contributors continuing small GitHub-native maintenance tasks from issues.

It is not a betting product, coaching bot, hidden-MMR estimator, private account data store, or credentialed provider integration.

## Current Capabilities

| Capability | Current status |
| --- | --- |
| Hero meta overview | Public/pro pick and win-rate signals |
| Hero detail | Selectable hero profile with matchup, role, item timing, and insight summaries |
| Counter matrix | OpenDota matchup data with fallback resilience |
| Player form | Recent public match summary by account ID |
| Match timeline | Event timeline and replay-style nodes by match ID |
| Map signals | Ward and lane heat samples from parsed match data |
| Item path | Staged item build path for the selected hero |
| Provider boundary | Public OpenDota first; credentialed providers documented but not connected |

See `VISION.md` for the product thesis, roadmap themes, and data-source boundaries.

## Quick Start

Install dependencies and run the local app:

```bash
npm ci
npm run dev
```

Open the local Next.js URL printed by the dev server. The dashboard should render with public OpenDota data when available and fallback data when public requests fail or time out.

Build and lint before opening a PR:

```bash
npm run lint
npm run test:api
npm run build
```

## Serverless API

```text
GET /api/dota/overview
GET /api/dota/hero/:heroId
GET /api/dota/player/:accountId
GET /api/dota/match/:matchId
```

The hero detail route returns a hero summary, matchup matrix, item timings, and lightweight insight summaries. Provider calls are normalized in `src/lib/dota/opendota.ts`; shared response shapes live in `src/lib/dota/types.ts`.

## Data Sources

- **OpenDota public API**: the only live provider today. It powers hero stats, hero matchups, item popularity, player recent matches, pro match IDs, parsed match events, ward logs, and lane position samples.
- **Fallback/sample data**: bundled resilience data for local builds and demos when OpenDota is unavailable. It is non-authoritative and should not be treated as current match or player truth.
- **Steam Web API**: planned official static/account-backed provider. It is not connected yet and requires explicit credential authorization before use.
- **STRATZ GraphQL**: planned token-backed provider for patch-specific hero stats, talent distribution, and deeper meta data. It is not connected yet and requires explicit credential authorization before use.

Do not add credentialed provider access, paid API use, private player data storage, production data operations, or cloud resource mutations without explicit authorization.

## Item, Ability, And Talent Lookup Boundaries

Build lookup work stays public-data-first:

| Domain | Public data available today | Requires credentialed provider later |
| --- | --- | --- |
| Items | OpenDota `/constants/items` metadata and `/heroes/{heroId}/itemPopularity` phase buckets | Patch/rank/role-filtered item trends and personalized build recommendations |
| Abilities | Static OpenDota ability metadata for future name/icon lookup | Hero-specific skill build timelines and ability pick/win distributions |
| Talents | Static talent labels where represented in public ability constants | Talent pick/win distributions and patch/bracket-filtered talent analysis |

The reusable contract lives in `src/lib/dota/lookup-boundaries.ts`. Fallback item, ability, or talent examples are only for local demos and outage resilience; they should never be treated as current match, current patch, or personalized truth.

## Local Development

Common commands:

```bash
npm ci
npm run dev
npm run lint
npm run test:api
npm run build
```

The baseline CI gate runs install, lint, provider-level API fallback tests, and build. For UI work, also run focused route smoke checks or browser smoke where the local environment supports it. Record any browser/tooling limitation in the pull request validation notes.

## Repository Map

```text
src/app/                     Next.js App Router pages, layout, and API routes
src/app/api/dota/            Serverless Dota API route handlers
src/components/dota/         Dashboard UI
src/lib/dota/                Provider, fallback, and shared Dota types
docs/maintenance-plan.md     Maintenance cadence, backlog, and permission boundary
VISION.md                    Product thesis and roadmap themes
.github/                     CI workflow and issue/PR templates
```

## Roadmap

Near-term work should stay small and public-data-first:

1. Add patch-aware hero win rates and role/rank comparison.
2. Wire public item, ability, and talent lookup UI against the documented boundary.
3. Add dashboard desktop/mobile visual smoke coverage.
4. Expand route/provider test coverage as new lookup surfaces are wired.
5. Document credentialed provider requirements before adding Steam, STRATZ, or paid OpenDota access.
6. Explore time-filtered ward, lane, objective, and fight layers for match replay views.

See `VISION.md`, `docs/maintenance-plan.md`, and the open GitHub issues for the current queue.

## Contributing

Use the repository workflow for non-trivial changes:

1. Open or link a GitHub issue with scope, acceptance criteria, validation, docs impact, and risk/rollback.
2. Create a topic branch for one coherent change.
3. Open a pull request with local validation evidence.
4. Wait for GitHub Actions.
5. Merge only after the PR is low-risk, green, and reviewable.

Keep runtime feature work separate from deployment, release, production data, cloud resource, and credentialed-provider changes.

## Safety Boundary

Allowed by default:

- public, unauthenticated OpenDota API use;
- fallback/sample data for local resilience;
- local lint, build, route smoke, and browser smoke;
- GitHub issues, branches, PRs, Actions, and low-risk green merges.

Requires explicit authorization:

- production deploys;
- formal releases, tags, or package publishes;
- Steam, STRATZ, paid OpenDota, or other credentialed providers;
- storing private player/account data;
- production data operations;
- cloud resource changes;
- sensitive credential access;
- destructive git operations.
