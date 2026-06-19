# Aegis Atlas Vision

Aegis Atlas is a serverless Dota2 intelligence dashboard for exploring public match data, hero trends, player form, and replay-derived tactical signals without requiring private credentials for the baseline experience.

The product should feel like an analyst workbench: dense, fast to scan, and grounded in source-backed data. It is not a landing page, prediction market, coaching bot, or private account data store.

## Current Product Thesis

Build a trustworthy MVP on public OpenDota data first, with stale cached public data as the first outage fallback and bundled sample data only for cold-start resilience and demos. The app should make clear which numbers are live, stale, sampled, and which provider slots are planned.

The baseline data model is intentionally conservative:

- OpenDota public API is the current live source.
- Stale cached OpenDota data keeps the app useful when OpenDota is temporarily unavailable after a successful refresh.
- Bundled sample data keeps the app renderable only when no cached OpenDota data exists.
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

Move from item popularity toward full build understanding. Start with OpenDota constants and public item timing data, keep ability/talent lookup limited to static public metadata, and require an explicitly authorized provider before adding hero-specific skill order or talent distribution analytics.

Boundary today:

- Items can use public OpenDota item constants and hero item popularity buckets.
- Abilities can use public static ability metadata once lookup is wired, but not skill-order distribution claims.
- Talents can use static labels where public constants expose them, but not pick/win distribution claims.
- Fallback examples support demos and outage resilience only; they are not current-patch truth.

Future work:

- Item, ability, and talent lookup UI over the public-data boundary.
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
- Prefer last cached public data over bundled sample data during outages, and show the last updated timestamp.
- Treat bundled sample data as resilience, not truth.
- Ship small GitHub-native increments through issue, branch, PR, CI, and merge decision.
- Keep product work separate from deploys, releases, production data operations, and sensitive credentials.

## First Product Milestones

1. Bootstrap GitHub-native maintenance workflow.
2. Document product vision and roadmap.
3. Expand hero detail into patch-aware win-rate and role/rank views.
4. Use documented item, ability, and talent lookup boundaries to wire lookup UI.
5. Expand route/provider tests as new provider surfaces are added.
6. Add dashboard desktop/mobile visual smoke coverage.
