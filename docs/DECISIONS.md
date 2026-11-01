# Architecture Decision Log

## ADR-001: Separate web and native mobile clients

**Decision:** Use React for web and React Native/Expo for mobile rather than trying to force one UI implementation across all platforms.

**Reason:** The portfolio explicitly needs browser automation and native mobile automation/build artifacts. Shared domain logic and API client reduce duplication without compromising native behavior.

## ADR-002: No authentication in initial scope

**Decision:** All initial product flows are available without credentials.

**Reason:** Keep the app small and remove account setup as a test prerequisite.

## ADR-003: Shared API and database

**Decision:** Web, Android, and iOS use one REST API and one database. The database engine is set by ADR-006.

**Reason:** Supports cross-client persistence and meaningful API/UI consistency checks.

## ADR-004: Test utilities are environment-restricted

**Decision:** Seed/reset utilities are only available in isolated test environments; prefer direct scripts in CI when possible.

**Reason:** Deterministic test setup is useful, but destructive utilities must not be available in production.

## ADR-005: Native builds are required

**Decision:** Use Expo native builds/EAS where appropriate, not Expo Go as the sole mobile delivery mechanism.

**Reason:** The portfolio requires native automation and installable artifacts. iOS distribution requires signing and provisioning.

## ADR-006: SQLite for initial scope

**Decision:** Use SQLite instead of PostgreSQL and remove Docker from the initial scope. Phase 1 has no database code; Prisma with SQLite arrives in Phase 2, with separate files for development and test data. PostgreSQL and Docker can return later as an optional portfolio enhancement.

**Reason:** Local development needs no database server or container runtime.

**Rules that keep the move possible:** Keep database access behind repository functions, keep `DATABASE_URL` as the only connection setting, and avoid raw SQLite-specific SQL. Moving later means changing the Prisma provider, regenerating migrations, and re-testing.

**Consequences:**

- Prisma's `mode: "insensitive"` is unavailable on SQLite, so case-insensitive title search needs another approach and a test covering non-ASCII titles.
- SQLite allows one writer at a time, which affects concurrent-update tests and limits what write-load results show.
- A deployed API needs a persistent disk and cannot run as multiple instances.

## ADR-007: Task rules and API conventions

**Decision:** Allow only `PENDING` to `IN_PROGRESS`, `IN_PROGRESS` to `COMPLETED`, and `COMPLETED` to `PENDING`. Blocked changes return `409`. Validation failures return `400`, and `422` is not used. "Today" comes from an injected clock using `APP_TIMEZONE`, defaulting to UTC. Title search uses the `titleNormalized` column, which stores a lowercased title with `%` and `_` replaced by private-use characters. Reset and seed are scripts, not HTTP routes.

**Reason:** The product owner approved the explicit transition rule. SQLite's `LIKE` only ignores case for ASCII, and Prisma's `contains` does not escape `%` and `_` on SQLite, so the encoded column keeps search correct, without raw SQL, while pagination stays in the database.

**Consequences:**

- A task cannot go straight from `PENDING` to `COMPLETED`.
- A user far from `APP_TIMEZONE` can have a date rejected near midnight.
- Changing how titles are encoded requires rewriting `titleNormalized` for existing rows.
- Status changes check then write, so two racing requests can both succeed. The final state is still valid.

## ADR-008: Separate application and automation repositories

**Decision:** This repository holds the application, unit tests, integration tests, and application CI/CD. A separate TaskFlow Automation repository holds PactumJS, Playwright, Appium + WebdriverIO + Mocha, k6, Allure, cross-browser/device testing, regression suites, and its own CI/CD. This decision is permanent unless the owner explicitly approves a change.

**Reason:** The automation repository validates TaskFlow independently, as an external consumer, through its public API and user interfaces. Keeping it separate proves that independence and keeps this repository focused on the product.

**Consequences:**

- The PactumJS suite built in Phase 2 was removed from this repository (it remains in git history at `9cc71b3`), and its full-stack and concurrency coverage moved to Supertest integration tests.
- Reset and seed stay as scripts, not HTTP routes. The automation pipeline checks out this repository and runs the documented commands. This is the one permitted exception to API/UI-only access, and only for test setup.
- `/api/v1/health` serves as both the health and readiness check.

## ADR-009: Mobile navigation and tests

**Decision:** Use Expo Router for mobile navigation and `jest-expo` with React Native Testing Library for mobile component tests. After a save, both clients open Task Details. Dashboard filters live in the URL on web and in screen state on mobile, which uses Load more instead of Previous and Next.

**Reason:** Expo Router's file routes match the deep link specification and are pinned by Expo SDK 58. Vitest does not run React Native components reliably.

**Consequences:**

- Route files are not covered by component tests, because `expo-router` is mocked. Deep links are confirmed on devices.
- Native folders are generated, so `app.json` is the source of truth for native configuration.
