# Maintenance Plan

## 3-Hour Cadence

The current Codex thread has a heartbeat automation named `Dota2 项目维护循环` with id `dota2`.

Every 3 hours it should:

1. Read the newest user instruction and current repo state.
2. Check whether the target is this Dota2 project or one of the pinned GitHub repositories.
3. Summarize meaningful changes only.
4. Continue the next low-risk GitHub-native maintenance task.
5. Stop before deploys, releases, production data operations, cloud resource changes, destructive git operations, or credentialed provider access unless explicitly authorized.

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

## GitHub-Native Workflow

All non-trivial work should move through:

1. GitHub issue with scope, acceptance criteria, validation, docs impact, and risk/rollback.
2. Topic branch.
3. Pull request.
4. GitHub Actions.
5. Review and merge decision.

Routine maintenance has standing authorization for git initialization, commits, branches, pushes, issue creation, pull request creation, CI repair, and merging low-risk green maintenance PRs.

## Permission Boundary

Allowed by default:

- Read code and public GitHub metadata.
- Run local install/build/lint/test/dev server.
- Create local code changes in this workspace.
- Create GitHub issues and pull requests for routine maintenance.
- Push topic branches and merge low-risk green maintenance pull requests.
- Use public, unauthenticated Dota2 APIs.

Ask first:

- Deploy to Vercel/Cloudflare.
- Use Steam, STRATZ, OpenDota paid, or other credentialed API access.
- Store user/player data.
- Publish releases.
- Create formal releases, tags, or package publishes.
- Run production data or cloud resource operations.
- Perform destructive git operations.

## Quality Gate

Before any PR/deploy:

- `npm run lint`
- `npm run build`
- GitHub Actions green
- Browser smoke test on desktop and mobile viewports
- API route smoke for `/api/dota/overview`, `/api/dota/player/:id`, `/api/dota/match/:id`
- Autoreview for non-trivial code changes
- Data-source notes updated when providers change
