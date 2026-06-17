# Aegis Atlas

Serverless Dota2 intelligence dashboard built with Next.js App Router.

The first version focuses on a usable analytics workbench instead of a landing page:

- hero meta table with pub/pro pick and win-rate signals
- hero counter matrix from OpenDota matchup data
- player recent-match form by Steam account ID
- match event timeline by match ID
- ward and lane heat map from parsed match data
- staged item build path for the selected hero
- provider slots for Steam Web API and STRATZ GraphQL

## Commands

```bash
npm ci
npm run dev
npm run build
npm run lint
```

## Serverless API

```text
GET /api/dota/overview
GET /api/dota/player/:accountId
GET /api/dota/match/:matchId
```

The OpenDota provider has fallback data so local builds and demos still render if the public API is temporarily unavailable.

## Data Sources

- OpenDota public API: the only live provider today. It powers hero stats, hero matchups, item popularity, player recent matches, pro match IDs, parsed match events, ward logs, and lane position samples.
- Fallback/sample data: bundled resilience data for local builds and demos when OpenDota is unavailable. It is non-authoritative and should not be treated as current match or player truth.
- Steam Web API: planned official static/account-backed provider. It is not connected yet and requires explicit credential authorization before use.
- STRATZ GraphQL: planned token-backed provider for patch-specific hero stats, talent distribution, and deeper meta data. It is not connected yet and requires explicit credential authorization before use.

Do not add credentialed provider access, private player data storage, production data operations, or cloud resource mutations without explicit authorization.

## GitHub Workflow

Development uses a GitHub-native flow:

1. Open or link a GitHub issue with scope, acceptance criteria, validation, docs impact, and risk/rollback.
2. Create a topic branch for the smallest coherent change.
3. Open a pull request and wait for GitHub Actions.
4. Merge only low-risk green pull requests unless a separate owner decision is needed.

The baseline CI gate is:

```bash
npm ci
npm run lint
npm run build
```

## Maintenance Model

This project is intended to run under a 3-hour agent maintenance heartbeat:

1. Check GitHub issue/PR queue, CI, dependency freshness, data-source health, and release readiness.
2. Classify work as autonomous, needs owner, or defer.
3. Implement one low-risk autonomous item at a time.
4. Run focused tests, build, lint, live UI proof, and autoreview before public mutation.
5. Keep deploys, releases, production data operations, cloud resources, and credentialed provider access behind explicit authorization.

See [docs/maintenance-plan.md](docs/maintenance-plan.md).
