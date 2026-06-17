# Maintenance Plan

## 3-Hour Cadence

The current Codex thread has a heartbeat automation named `Dota2 项目维护循环` with id `dota2`.

Every 3 hours it should:

1. Read the newest user instruction and current repo state.
2. Check whether the target is this Dota2 project or one of the pinned GitHub repositories.
3. Summarize meaningful changes only.
4. Continue the next authorized low-risk task.
5. Stop before public mutations unless explicitly authorized.

## Current Pinned Repositories

Detected from the authenticated GitHub account `RayLi-Muye`:

- `RayLi-Muye/CatHub`
- `MistArchitect/MistArchitectWeb`
- `RayLi-Muye/bird_detection`
- `RayLi-Muye/Frontend-trading-ReactNative`
- `RayLi-Muye/renderfarm-k8s-toolkit`

These are the initial maintenance-loop candidates. Treat each repo independently, read its local instructions first, and avoid push/PR/merge/release without explicit approval.

## Aegis Atlas Backlog

### MVP Complete

- Next.js App Router project.
- Serverless OpenDota routes.
- Dashboard UI for hero meta, counters, player form, replay event nodes, item timings, and map heat.
- 3-hour thread heartbeat configured.

### Next Build Items

- Add hero detail route with selectable hero IDs instead of one featured hero.
- Add item/ability/talent lookup backed by OpenDota constants.
- Add optional STRATZ provider for patch-specific win rates, talent stats, and pro meta.
- Add Steam auth/account-linking plan if personal/private player data is needed.
- Persist searches and favorites in a serverless KV/database.
- Add route-level tests for API normalization and fallback behavior.
- Add browser visual regression smoke for dashboard desktop/mobile layouts.

## Permission Boundary

Allowed by default:

- Read code and public GitHub metadata.
- Run local install/build/lint/test/dev server.
- Create local code changes in this workspace.
- Use public, unauthenticated Dota2 APIs.

Ask first:

- Create GitHub repo or push code.
- Create/update PRs or public comments.
- Deploy to Vercel/Cloudflare.
- Use Steam, STRATZ, OpenDota paid, or other credentialed API access.
- Store user/player data.
- Publish releases.

## Quality Gate

Before any PR/deploy:

- `npm run lint`
- `npm run build`
- Browser smoke test on desktop and mobile viewports
- API route smoke for `/api/dota/overview`, `/api/dota/player/:id`, `/api/dota/match/:id`
- Autoreview for non-trivial code changes
- Data-source notes updated when providers change
