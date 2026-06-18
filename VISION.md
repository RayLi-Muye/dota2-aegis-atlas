# Aegis Atlas Vision

Aegis Atlas is a serverless Dota2 intelligence dashboard for exploring public match data, hero trends, player form, and replay-derived tactical signals without requiring private credentials for the baseline experience.

The product should feel like an analyst workbench: dense, fast to scan, and grounded in source-backed data. It is not a landing page, prediction market, coaching bot, or private account data store.

## Current Product Thesis

Build a trustworthy MVP on public OpenDota data first, with bundled fallback data only for local resilience and demos. The app should make clear which numbers are live, which are sampled, and which are planned provider slots.

The baseline data model is intentionally conservative:

- OpenDota public API is the current live source.
- Fallback/sample data keeps the app renderable when OpenDota is unavailable.
- Steam Web API, STRATZ GraphQL, paid OpenDota access, and other credentialed providers are future integrations that require explicit authorization before use.
- Private player data storage and production data operations are out of scope until a separate privacy and infrastructure plan exists.

## MVP Capabilities

The current MVP demonstrates the core dashboard shape:

- Hero meta table with public and pro pick/win-rate signals.
- Selectable hero detail with matchup and item timing insights.
- Hero counter matrix from OpenDota matchup data.
- Player recent-match form by Steam account ID.
- Match event timeline by match ID.
- Ward and lane heat map from parsed match data.
- Staged item build path for the featured hero.
- Serverless API routes for overview, player profile, and match replay data.

## Roadmap Themes

### Hero Intelligence

Add hero detail exploration so users can select any hero and inspect current pick rate, win rate, role fit, item timings, matchup spread, and trend movement.

Future issues should separate:

- Hero detail route and selector.
- Patch-aware hero win rates.
- Pro/public meta comparison.
- Role and rank bucket breakdowns.

### Matchups And Counters

Make counters actionable by distinguishing high-confidence matchups from low-sample noise. The dashboard should show why a counter matters: win-rate delta, sample size, role context, and trend direction.

Future work:

- Confidence and sample-size display.
- Lane/core/support matchup filters.
- Patch-specific matchup movement when provider support exists.

### Items, Skills, And Talents

Move from item popularity toward full build understanding. Start with OpenDota constants and public item timing data, then document credentialed provider needs before adding token-backed talent or ability distributions.

Future work:

- Item and ability lookup.
- Hero-specific skill build timeline.
- Talent pick/win distribution behind an explicitly authorized provider.
- Patch comparison for item and talent changes.

### Player And Hero Skill Views

Player pages should summarize recent form, signature heroes, performance trends, and replay entry points without implying hidden MMR or private account access.

Future work:

- Persisted recent searches or favorites after a storage decision.
- Hero proficiency summaries from public match history.
- Match drill-down from player history.
- Clear boundaries for private/account-linked features.

### Map, Vision, And Replay Exploration

Replay-derived map surfaces should help users inspect important tactical phases: ward placement, lane heat, deaths, objectives, Roshan, towers, and teamfights.

Future work:

- Time-filtered ward and heat layers.
- Timeline-to-map interaction.
- Objective and fight clustering.
- Single-match event replay queries by node type.

## Operating Principles

- Prefer public, reproducible data before credentialed integrations.
- Keep provider boundaries visible in the UI and docs.
- Treat fallback data as resilience, not truth.
- Ship small GitHub-native increments through issue, branch, PR, CI, and merge decision.
- Keep product work separate from deploys, releases, production data operations, and sensitive credentials.

## First Product Milestones

1. Bootstrap GitHub-native maintenance workflow.
2. Document product vision and roadmap.
3. Expand hero detail into patch-aware win-rate and role/rank views.
4. Add item, ability, and talent lookup boundaries.
5. Add route-level tests for API normalization and fallback behavior.
6. Add dashboard desktop/mobile visual smoke coverage.
