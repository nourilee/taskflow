# TaskFlow

A small, no-authentication task management application for web, Android, and iOS, with a shared REST API. It is the system under test for a separate SDET automation portfolio.

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
- Unit and integration tests: Vitest, React Testing Library, Supertest
- CI/CD: GitHub Actions

## Two-repository testing approach

| Repository                     | Responsibility                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TaskFlow (this repository)     | Application code, unit tests, integration tests, and application CI/CD                                                                   |
| TaskFlow Automation (separate) | API automation, web and mobile E2E, performance, cross-browser and cross-device testing, regression suites, reporting, and its own CI/CD |

The TaskFlow Automation repository independently validates TaskFlow as an external consumer. It does not import application code or rely on internal tests, and it uses only the public API, the user interfaces, and the documented test data setup commands. Passing internal tests never replaces external validation, and external tests never replace internal ones.

See `docs/TEST_STRATEGY.md` for the boundary and `docs/EXTERNAL_TESTING.md` for integration details.

## Repository status

Phases 1 to 4 are in place: a monorepo with the task REST API on SQLite, the web client, and the Expo mobile client. See `apps/mobile/README.md` for native builds. Build incrementally and keep each phase runnable.

## Getting started

1. Install Git and a Node version manager such as fnm or nvm. The Node version is pinned in `.nvmrc`.
2. Install that Node version, then pnpm at the version in `package.json`.
3. Run `pnpm install`.
4. Copy `.env.example` to `.env`.
5. Run `pnpm --filter @taskflow/api db:deploy` to create the database.
6. Optionally run `pnpm --filter @taskflow/api db:seed` to add sample tasks.
7. Run `pnpm dev`, then open `http://localhost:5173` for the web app or `http://localhost:3000/api/v1/docs` for the API docs.

Checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:integration`, `pnpm build`.

Read `AGENTS.md` and the documents in `docs/` before making changes. The phase plan is in `docs/IMPLEMENTATION_ROADMAP.md`.

## Seed data

`apps/api/src/test-support/seed-tasks.ts` defines six tasks with fixed IDs and timestamps, covering each status plus overdue, completed-past-due, future, and no-due-date cases. Seeding leaves tasks with other IDs in place and refuses to run when `NODE_ENV=production`.

To reset the test database, run `NODE_ENV=test ENABLE_TEST_UTILITIES=true pnpm --filter @taskflow/api db:test:reset`. It refuses unless the target file is named `test.db` and differs from `DATABASE_URL`.

## Important rules

- Do not add authentication to the initial scope.
- Keep the product to the three defined screens.
- Keep web and native mobile clients separate; share domain types, validation, business rules, and API client where practical.
- Keep business rules in shared, testable modules rather than duplicating them in UI components.
- Never expose test reset/seed endpoints in production.
- Do not commit secrets, signing certificates, provisioning profiles, or real credentials.
- Do not claim an IPA is distributable unless it is correctly signed and provisioned.
- Add tests with each feature; do not defer all testing until the end.
