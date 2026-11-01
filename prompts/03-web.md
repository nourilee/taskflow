# Claude Code Prompt — Phase 3: Web Client

Read `AGENTS.md`, requirements, architecture, API, deep-link, and test strategy documents.

Implement the React + Vite web client with exactly three primary screens:

1. Dashboard
2. Task Details
3. Create/Edit Task

Connect to the real TaskFlow API using the shared typed API client. Implement search, status filters, due-date sorting, summary counters, overdue state, loading/empty/error/retry/not-found states, form validation, delete confirmation, and status changes.

Add React Router routes for `/` and `/tasks/:taskId`, plus a route for create/edit as appropriate without adding a fourth product screen.

Use accessible semantic controls and stable `data-testid` values where useful. Add component tests and Playwright tests for critical user journeys.

Do not mock the backend in the primary end-to-end tests. Use the isolated test environment and deterministic seed/reset process. Present a plan first, then implement and validate.
