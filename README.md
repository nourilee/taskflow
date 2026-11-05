# TaskFlow

A small, no-authentication task management application for web, Android, and iOS, with a shared REST API. It is the system under test for a separate SDET automation portfolio.

## Product scope

Three primary screens:

1. **Dashboard** — list, search, filter, sort, summary counters, overdue indicators.
2. **Task Details** — view task, update status, edit, delete with confirmation.
3. **Create/Edit Task** — shared form with validation.

Users can create, view, update, complete, reopen, and delete tasks without signing in.

Web and mobile share one brand and offer Light, Dark, and System themes. See `docs/DESIGN_SYSTEM.md`.

## Two-repository testing approach

| Repository                     | Responsibility                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| TaskFlow (this repository)     | Application code, unit tests, integration tests, and application CI/CD                                                                   |
| TaskFlow Automation (separate) | API automation, web and mobile E2E, performance, cross-browser and cross-device testing, regression suites, reporting, and its own CI/CD |

The automation repository validates TaskFlow independently, as an external consumer. See `docs/TEST_STRATEGY.md` for the boundary and `docs/EXTERNAL_TESTING.md` for integration details.

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

## Documentation

| Topic                                | Source                                                |
| ------------------------------------ | ----------------------------------------------------- |
| Rules for contributors and AI agents | `AGENTS.md`                                           |
| Product requirements                 | `docs/REQUIREMENTS.md`, `docs/PROJECT_OVERVIEW.md`    |
| Architecture and technology stack    | `docs/TECHNICAL_ARCHITECTURE.md`, `docs/DECISIONS.md` |
| REST API contract                    | `docs/API_SPECIFICATION.md`                           |
| Deep links                           | `docs/DEEP_LINK_SPECIFICATION.md`                     |
| Testing and CI/CD                    | `docs/TEST_STRATEGY.md`, `docs/CI_CD_STRATEGY.md`     |
| Seed data and reset                  | `docs/EXTERNAL_TESTING.md`                            |
| Test identifiers                     | `docs/UI_COMPONENT_LOCATOR_INVENTORY.md`              |
| Brand, themes, and components        | `docs/DESIGN_SYSTEM.md`                               |
| Phase plan                           | `docs/IMPLEMENTATION_ROADMAP.md`                      |
| Native mobile builds                 | `apps/mobile/README.md`                               |
