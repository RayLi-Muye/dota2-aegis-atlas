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

- OpenDota public API: live hero stats, hero matchups, item popularity, player recent matches, pro match IDs, parsed match events, ward logs, lane position samples.
- Steam Web API: planned official static/account-backed provider.
- STRATZ GraphQL: planned token-backed provider for patch-specific hero stats, talent distribution, and deeper meta data.

## Maintenance Model

This project is intended to run under a 3-hour agent maintenance heartbeat:

1. Check GitHub issue/PR queue, CI, dependency freshness, data-source health, and release readiness.
2. Classify work as autonomous, needs owner, or defer.
3. Implement one low-risk autonomous item at a time.
4. Run focused tests, build, lint, live UI proof, and autoreview before public mutation.
5. Ask before push, PR creation/update, public comments, deploy, release, or credential use.

See [docs/maintenance-plan.md](docs/maintenance-plan.md).
