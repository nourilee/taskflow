# External Testing Guide

This guide is for the TaskFlow Automation repository, which validates TaskFlow as an external consumer. It must not import application code or rely on internal tests.

## What external automation may use

- The public REST API. See `docs/API_SPECIFICATION.md`, or `GET /api/v1/openapi.json` and `/api/v1/docs` on a running API.
- The web and mobile user interfaces.
- The setup commands in this guide, for test data only.

## Run an isolated test environment

Requires the Node and pnpm versions pinned in this repository. All commands run from the repository root.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm build
NODE_ENV=test ENABLE_TEST_UTILITIES=true pnpm --filter @taskflow/api db:test:reset
NODE_ENV=test DATABASE_URL=file:./test.db pnpm --filter @taskflow/api start
```

The API listens on `PORT` (default 3000), with base URL `http://localhost:3000/api/v1`. Never point a test API at `dev.db`.

## Reset test data

Run the reset command again at any time, including while the test API is running:

```sh
NODE_ENV=test ENABLE_TEST_UTILITIES=true pnpm --filter @taskflow/api db:test:reset
```

It applies migrations, deletes all tasks, and reloads the seed data. It refuses to run unless `NODE_ENV=test`, `ENABLE_TEST_UTILITIES=true`, the target file is named `test.db`, and the target differs from `DATABASE_URL`. There are no reset or seed HTTP routes.

To reset a test database at another path, set `TEST_DATABASE_URL` for the reset command and `DATABASE_URL` for the API to the same file. The file must be named `test.db`.

## Seed data

Six tasks with fixed IDs and timestamps. Treat them as read-only in parallel suites, and create unique records for tests that change data.

| ID                         | Status        | Priority | Due date     | Case                       |
| -------------------------- | ------------- | -------- | ------------ | -------------------------- |
| `seed-pending-overdue`     | `PENDING`     | `HIGH`   | `2020-01-15` | Overdue                    |
| `seed-in-progress-overdue` | `IN_PROGRESS` | `MEDIUM` | `2020-03-01` | Overdue                    |
| `seed-completed-past`      | `COMPLETED`   | `LOW`    | `2020-02-10` | Past due date, not overdue |
| `seed-pending-future`      | `PENDING`     | `MEDIUM` | `2099-06-30` | Not overdue                |
| `seed-in-progress-future`  | `IN_PROGRESS` | `HIGH`   | `2099-09-15` | Not overdue                |
| `seed-pending-no-date`     | `PENDING`     | `LOW`    | None         | Sorts last                 |

## Readiness

Poll `GET /api/v1/health` until it returns `200` before starting a suite. It returns `200` only when the database responds, and `503` otherwise.

## Configuration

| Setting                    | Purpose                                         |
| -------------------------- | ----------------------------------------------- |
| `PORT`                     | API port                                        |
| `DATABASE_URL`             | SQLite file used by the API                     |
| `TEST_DATABASE_URL`        | SQLite file targeted by the reset command       |
| `APP_TIMEZONE`             | Timezone that decides today's date; default UTC |
| `VITE_API_BASE_URL`        | API URL for the web app, set at build time      |
| `EXPO_PUBLIC_API_BASE_URL` | API URL for the mobile app, set at build time   |

## Stable contracts

- Errors use the structure in `docs/API_SPECIFICATION.md`. Match on `error.code`, not on message text.
- Every response carries `X-Request-Id`; include it in failure diagnostics.
- Web elements use `data-testid`, and mobile elements use `testID` with accessibility labels. Prefer role and label locators where available.
- Dates are `YYYY-MM-DD`. Compute "today" in `APP_TIMEZONE`, or use dates far from the boundary.

## Current limits

- The web and mobile task screens arrive in Phases 3 and 4, so only placeholder identifiers exist today.
- Browser calls from a different origin need CORS, which arrives in Phase 3.
