# Claude Code Prompt — Phase 1: Foundation

Read `AGENTS.md`, `README.md`, and all relevant documents under `docs/` before changing files.

We are implementing Phase 1 of TaskFlow only. Do not implement task CRUD or the full UI yet.

## Goal

Create a clean, runnable TypeScript monorepo using:

- pnpm workspaces
- Turborepo
- `apps/web`: React + Vite + TypeScript
- `apps/mobile`: React Native + Expo + TypeScript
- `apps/api`: Node.js + Express + TypeScript
- `packages/shared`
- `packages/api-client`

## Requirements

1. Inspect the current folder first. Do not overwrite existing user files.
2. Present a concise implementation plan and proposed dependency choices before editing.
3. Scaffold each app/package with minimal working code.
4. Add root scripts for dev, build, lint, typecheck, and test where meaningful.
5. Add `.gitignore` and `.env.example`; never create or commit real secrets.
6. Add an API `GET /api/v1/health` endpoint that reports service health. Do not expose test reset routes.
7. Add a minimal web landing page and mobile placeholder screen identifying the app as TaskFlow.
8. Configure consistent TypeScript and formatting/linting.
9. Add a basic GitHub Actions workflow for install, lint, typecheck, test, and build.
10. Keep dependencies current and mutually compatible; explain any version-sensitive choices.
11. Do not add authentication, Docker, PostgreSQL, Prisma, extra product screens, or unrelated features.

## Validation

Run the actual commands available in this environment:

- install with frozen lockfile after lockfile exists
- lint
- typecheck
- test
- build
- start the built API and verify the health endpoint

If a prerequisite is unavailable, report that clearly and provide the exact local command for the user to run.

## Completion report

Summarize:

- files/folders created
- architecture decisions
- commands executed and actual results
- any failures or unverified steps
- exact next step for Phase 2

Do not claim success for commands that were not executed.
