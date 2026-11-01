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
- SQLite allows one writer at a time, which affects concurrent-update tests and limits what k6 write results show.
- A deployed API needs a persistent disk and cannot run as multiple instances.
