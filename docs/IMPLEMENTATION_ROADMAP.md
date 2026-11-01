# Implementation Roadmap

Build in vertical slices. Each phase must leave the repository in a working state.

This roadmap covers the TaskFlow application only. External automation is implemented in the separate TaskFlow Automation repository and is not part of this roadmap.

## Phase 1 — Foundation

- Initialize pnpm monorepo and Turborepo.
- Configure TypeScript, linting, formatting, and environment conventions.
- Scaffold web, mobile, and API apps.
- Create shared and API-client packages.
- Add basic health endpoint.
- Add CI workflow for install, format check, lint, typecheck, test, and build.

**Exit criteria:** All apps/packages install and build; API health endpoint responds; CI workflow commands pass locally. CI passing on GitHub stays open until the repository is pushed.

## Phase 2 — Backend and domain

- Add database environment variables and Prisma with SQLite (ADR-006).
- Define Task model and Prisma schema.
- Implement migrations and deterministic seed.
- Implement shared Zod schemas and pure business rules.
- Implement CRUD/status API.
- Implement consistent error handling and OpenAPI.
- Add unit and integration tests.
- Add test-only reset/seed safeguards.

**Exit criteria:** API behavior and rules covered by automated tests; Swagger usable; test database reset reproducible.

## Phase 3 — Web client

- Implement dashboard, details, and create/edit screens.
- Connect typed API client.
- Add loading, empty, error, retry, validation, and not-found states.
- Add web deep-link route.
- Add accessible semantics and stable test IDs.
- Add component tests.

**Exit criteria:** Internal tests pass, and main user journeys were manually confirmed in a browser against persisted API data.

## Phase 4 — Mobile client

- Implement the same three screens in React Native.
- Connect shared API client and domain packages.
- Add native navigation and custom URL scheme.
- Add testID/accessibility identifiers.
- Configure Android/iOS native build profiles.
- Add mobile unit tests where practical.

**Exit criteria:** Internal tests pass, and the app and custom-scheme deep links were manually confirmed on Android and the iOS simulator.

## Phase 5 — Application CI/CD

- Add pull request, main, and release workflows.
- Add release build and deployment steps.

**Exit criteria:** Pipelines run internal tests, quality checks, and builds by trigger, and produce release artifacts.

## Phase 6 — Portfolio

- Architecture diagram and decision records.
- Public README.

The traceability matrix, execution evidence, CI/CD walkthrough, AI-assisted test maintenance demonstration, and demo recording belong to the TaskFlow Automation repository.

## Optional enhancement — PostgreSQL and Docker

After Phase 6, optionally move persistence from SQLite to PostgreSQL with Docker Compose. See ADR-006.

## Working agreement

Complete one vertical slice at a time. Do not begin the next phase while the current phase's exit criteria are unknown or failing without an explicitly documented reason.
