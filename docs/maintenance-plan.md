# Maintenance Plan

## Current Cadence

The active heartbeat automation is named `dota2` and runs as the coordinator for two routine projects:

- `RayLi-Muye/renderfarm-k8s-toolkit`
- `RayLi-Muye/dota2-aegis-atlas`

CatHub, Frontend Trading, MistArchitectWeb, and bird_detection are excluded from routine timed maintenance unless they are explicitly re-added later. MistArchitectWeb remains a customer-facing project and should not be checked routinely.

Every heartbeat should:

1. Read the newest user instruction and current routine project mapping.
2. Check the two routine project threads, GitHub issues/PRs/Actions, and local git state.
3. Push at least one clear next step when a safe autonomous maintenance task is available.
4. Keep non-trivial work on the GitHub-native path: issue, branch, pull request, Actions, and low-risk green merge.
5. Stop before deploys, releases, production data operations, real cloud resource changes, destructive git operations, sensitive credentials, or credentialed/paid provider access unless explicitly authorized.

## Current Priority

Keep public-data feature work moving through small, testable provider-contract slices before any credentialed provider work.

## Aegis Atlas Backlog

### MVP Complete

- Next.js App Router project.
- Serverless OpenDota routes.
- Dashboard UI for hero meta, counters, player form, replay event nodes, item timings, and map heat.
- Serverless hero detail route and dashboard hero selector for matchup and item timing insights.
- GitHub-native CI, issue templates, PR template, and product vision.

### Next Build Items

- Extend hero detail with patch-aware win rates and role/rank comparison.
- Wire item/ability/talent lookup UI over the documented public-data boundary.
- Add optional STRATZ provider for patch-specific win rates, talent stats, and pro meta after explicit credential authorization.
- Add Steam auth/account-linking plan if personal/private player data is needed.
- Persist searches and favorites only after a storage and privacy decision.
- Add route-level tests for API normalization and fallback behavior.
- Add browser visual regression smoke for dashboard desktop/mobile layouts.

## GitHub-Native Workflow

All non-trivial work should move through:

1. GitHub issue with scope, acceptance criteria, validation, docs impact, and risk/rollback.
2. Topic branch.
3. Pull request.
4. GitHub Actions.
5. Review and merge decision.

Routine maintenance has standing authorization for commits, branches, pushes, issue creation, pull request creation, CI repair, and merging low-risk green maintenance pull requests.

## Permission Boundary

Allowed by default:

- read code and public GitHub metadata;
- run local install/build/lint/test/dev server;
- create local code changes in this workspace;
- create GitHub issues and pull requests for routine maintenance;
- push topic branches and merge low-risk green maintenance pull requests;
- use public, unauthenticated Dota2 APIs.

Ask first:

- deploy to Vercel, Cloudflare, or another production host;
- use Steam, STRATZ, OpenDota paid, or other credentialed API access;
- store user/player data;
- publish releases, tags, or packages;
- run production data or cloud resource operations;
- perform destructive git operations.

## Quality Gate

Before routine PR merge:

- `npm run lint`
- `npm run test:api`
- `npm run build`
- GitHub Actions green
- focused API route smoke when API/provider behavior changes
- browser smoke on desktop/mobile when UI behavior changes and local tooling supports it
- autoreview for non-trivial code changes
- data-source notes updated when provider behavior changes

If browser tooling is unavailable, record the limitation in PR validation notes and rely on the closest available local and CI proof for low-risk changes.
