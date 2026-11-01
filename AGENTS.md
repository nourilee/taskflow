# TaskFlow — AI Coding Agent Instructions

## Role

Act as a senior full-stack engineer working with an SDET who owns the product quality strategy. Implement the smallest maintainable solution that satisfies the documented requirements. Explain material trade-offs and ask before changing approved architecture or scope.

## Source of truth

Before making changes, read:

- `README.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/REQUIREMENTS.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/API_SPECIFICATION.md`
- `docs/DEEP_LINK_SPECIFICATION.md`
- `docs/TEST_STRATEGY.md`
- `docs/CI_CD_STRATEGY.md`
- `docs/EXTERNAL_TESTING.md`
- `docs/IMPLEMENTATION_ROADMAP.md`

If documents conflict, do not silently choose. Identify the conflict and ask for a decision. Record approved changes in the relevant document.

## Product constraints

- Product name: TaskFlow.
- No login, registration, user accounts, or authentication in the initial release.
- Three primary screens only: Dashboard, Task Details, Create/Edit Task.
- Core operations: create, list, retrieve, update, change status, delete.
- Target clients: web, Android, iOS.
- API is shared by all clients.
- Support custom-scheme deep links and HTTPS app/universal links.
- Use seeded deterministic test data and isolated test environments.

## Architecture constraints

- TypeScript throughout the JavaScript/TypeScript codebase.
- pnpm workspaces + Turborepo monorepo.
- Separate React web app and React Native/Expo mobile app.
- Node.js + Express API.
- SQLite + Prisma (from Phase 2). PostgreSQL and Docker are a later optional enhancement; see ADR-006.
- Shared packages for domain types, Zod schemas, business rules, and API client.
- Keep UI, domain/business rules, API transport, and persistence concerns separated.
- Prefer simple, explicit abstractions over premature generalization.
- Do not introduce microservices, authentication, queues, or unnecessary infrastructure.

## Testing boundaries (permanent)

TaskFlow has two repositories. This decision changes only with explicit owner approval.

- **TaskFlow (this repository):** application code, unit tests, and integration tests.
- **TaskFlow Automation (separate repository):** PactumJS, Playwright, Appium + WebdriverIO + Mocha, k6, Allure, cross-browser/device testing, and regression suites.

In this repository:

1. Do not add Playwright, Appium, WebdriverIO, PactumJS, k6, or Allure.
2. Do not add E2E, API automation, mobile automation, or performance test directories.
3. Do not add dependencies or scripts intended for external automation frameworks.
4. Keep tests inside their application package, or a designated internal test directory.
5. CI runs only unit tests, integration tests, code quality checks, type checks, and builds.
6. Supertest route integration tests are internal. They are not external API automation.
7. Do not build features solely to suit one external automation framework.

Design for external testability instead: documented API contracts, predictable status codes and errors, stable `data-testid`/`testID` values, accessibility labels, deterministic seed/reset, isolated environments, and configurable base URLs. See `docs/EXTERNAL_TESTING.md`.

Component tests count as unit tests. Use Vitest for pure logic. `jest-expo` is allowed for mobile component tests if Phase 4 confirms it is needed.

## Engineering rules

1. Start each task by inspecting the existing repository and relevant docs.
2. For non-trivial work, present a short plan and files likely to change before editing.
3. Implement in small increments.
4. Add or update tests in the same change as the feature.
5. Run the narrowest relevant tests first, then typecheck/lint/build as appropriate.
6. Never report a test as passing unless it was actually run and passed.
7. Report commands run, results, known gaps, and next steps.
8. Do not hide failures with skipped tests, broad retries, swallowed exceptions, or weakened assertions.
9. Avoid flaky fixed sleeps; use condition-based waits in automation.
10. Keep selectors stable and user-facing where possible.

## Testability requirements

- Web interactive elements expose stable `data-testid` attributes where appropriate.
- React Native interactive elements expose stable `testID` and accessible labels/roles.
- API errors use a consistent response shape.
- Seed data is deterministic and documented.
- Test data reset is only available in an explicitly isolated test environment.
- Tests must not depend on execution order.
- Use unique test data where parallel execution can cause collisions.
- Make time-dependent business logic testable with an injected clock or explicit reference date.

## Security and environment rules

- Never commit `.env`, credentials, API keys, Apple signing materials, or private certificates.
- Provide `.env.example` with placeholders only.
- Bind destructive test utilities to test mode and a test database.
- Refuse to implement a destructive reset route that can run against production.
- Validate all incoming API input at the server boundary.
- Do not trust client-side validation as the only validation.

## Definition of done

A task is complete only when:

- Acceptance criteria are met.
- Relevant tests are added/updated and executed.
- Typecheck/lint/build pass where configured.
- Documentation/configuration is updated.
- No secrets or generated build artifacts are accidentally committed.
- A concise completion report lists changes, commands/results, and remaining risks.

## Scope discipline

Do not add features merely because they are common in task apps. Specifically defer:

- Authentication and profiles
- Collaboration, teams, and sharing
- Notifications and reminders
- Attachments and comments
- Recurring tasks
- Calendar integrations
- Complex offline sync
- Multi-tenant support

If a feature is needed for a testing demonstration, propose it separately and get approval first.
