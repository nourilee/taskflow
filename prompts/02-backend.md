# Claude Code Prompt — Phase 2: Backend and Domain

Read `AGENTS.md` and the relevant requirements, architecture, API, and test strategy documents.

Add the database environment variables to `.env.example`, which Phase 1 deliberately left out. Implement the Task domain, Prisma/SQLite persistence (see ADR-006), migrations, deterministic seed data, REST CRUD/status endpoints, Zod validation, consistent errors, and OpenAPI/Swagger.

Add unit tests for pure business rules, integration tests against a dedicated test database, and PactumJS API tests.

Important:

- Duplicate titles are allowed.
- Title is trimmed and must be 3–100 characters.
- Description is optional and max 500 characters.
- Priority: LOW, MEDIUM, HIGH.
- Status: PENDING, IN_PROGRESS, COMPLETED.
- Due date is optional; reject past due dates on create, but permit editing an existing overdue task.
- Inject/reference a clock for deterministic date tests.
- Test reset/seed must be impossible in production and must require a dedicated test database.
- Never run destructive commands against a database until its target has been verified.

First present a plan. Implement in small steps, run tests, and report actual results.
