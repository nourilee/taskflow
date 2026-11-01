# TaskFlow — SDET Engineering Showcase

A small, no-authentication task management application built to demonstrate end-to-end software quality engineering across web, Android, iOS, API, and CI/CD.

## Product scope

Three primary screens:

1. **Dashboard** — list, search, filter, sort, summary counters, overdue indicators.
2. **Task Details** — view task, update status, edit, delete with confirmation.
3. **Create/Edit Task** — shared form with validation.

Users can create, view, update, complete, reopen, and delete tasks without signing in.

## Initial technology decisions

- Monorepo: pnpm workspaces + Turborepo
- Web: React + Vite + TypeScript
- Mobile: React Native + Expo (native builds, not Expo Go as the only delivery target)
- API: Node.js + Express + TypeScript
- Database: SQLite + Prisma (from Phase 2; PostgreSQL and Docker are a later optional enhancement, see ADR-006)
- Validation: Zod
- Unit/component tests: Vitest + React Testing Library
- Web E2E: Playwright
- Mobile E2E: Appium + WebdriverIO + Mocha
- API automation: PactumJS
- Performance: k6
- CI/CD: GitHub Actions
- Reporting: Allure

## Repository status

Phase 1 (foundation) is in place: a runnable monorepo with an API health endpoint and placeholder web and mobile apps. Task features start in Phase 2. Build incrementally and keep each phase runnable.

## Getting started

1. Install Git and a Node version manager such as fnm or nvm. The Node version is pinned in `.nvmrc`.
2. Install that Node version, then pnpm at the version in `package.json`.
3. Run `pnpm install`.
4. Copy `.env.example` to `.env`.
5. Run `pnpm dev`, then open `http://localhost:3000/api/v1/health`.

Checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

Read `AGENTS.md` and the documents in `docs/` before making changes.

## Important rules

- Do not add authentication to the initial scope.
- Keep the product to the three defined screens.
- Keep web and native mobile clients separate; share domain types, validation, business rules, and API client where practical.
- Keep business rules in shared, testable modules rather than duplicating them in UI components.
- Never expose test reset/seed endpoints in production.
- Do not commit secrets, signing certificates, provisioning profiles, or real credentials.
- Do not claim an IPA is distributable unless it is correctly signed and provisioned.
- Add tests with each feature; do not defer all testing until the end.

## Suggested first milestone

A local monorepo skeleton with:

- pnpm workspace and Turborepo configuration
- `apps/web`, `apps/mobile`, `apps/api`
- `packages/shared`, `packages/api-client`
- TypeScript, linting, formatting, and a basic CI workflow
- a successful local build/typecheck/test command (even if initial tests are minimal)

See `docs/IMPLEMENTATION_ROADMAP.md`.
