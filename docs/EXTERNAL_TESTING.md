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
| `CORS_ORIGINS`             | Browser origins allowed to call the API         |
| `APP_TIMEZONE`             | Timezone that decides today's date; default UTC |
| `VITE_API_BASE_URL`        | API URL for the web app, set at build time      |
| `EXPO_PUBLIC_API_BASE_URL` | API URL for the mobile app, set at build time   |

## Stable contracts

- Errors use the structure in `docs/API_SPECIFICATION.md`. Match on `error.code`, not on message text.
- Every response carries `X-Request-Id`; include it in failure diagnostics.
- Web elements use `data-testid`, and mobile elements use `testID` with accessibility labels. Prefer role and label locators where available.
- Dates are `YYYY-MM-DD`. Compute "today" in `APP_TIMEZONE`, or use dates far from the boundary.

## Run the web app

The web app reads `VITE_API_BASE_URL` at build time. The API only accepts browser calls from origins in `CORS_ORIGINS`, which defaults to `http://localhost:5173`. If the web app runs elsewhere, add that origin.

```sh
pnpm --filter @taskflow/web dev
```

Routes: `/` (dashboard), `/tasks/new`, `/tasks/{taskId}`, and `/tasks/{taskId}/edit`. Unknown paths redirect to the dashboard. Dashboard filters live in the URL as `status`, `search`, `order`, and `page`.

## Web test identifiers

Prefer role and label locators. These `data-testid` values are a stable contract:

| Area             | Values                                                                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App              | `app-title`, `loading`, `load-error`, `retry`, `task-not-found`, `back-to-dashboard`                                                                                                                                 |
| Dashboard        | `create-task`, `task-search`, `task-sort`, `task-list`, `task-card-{id}`, `task-overdue-{id}`, `empty-state`, `no-results`, `clear-filters`, `previous-page`, `next-page`, `page-indicator`                          |
| Status filters   | `status-filter-{all,pending,in-progress,completed}`, with counts in `dashboard-summary-{all,pending,in-progress,completed}`                                                                                          |
| Task Details     | `task-title`, `task-status`, `task-priority`, `task-due-date`, `task-description`, `task-created-at`, `task-updated-at`, `status-action-{pending,in-progress,completed}`, `edit-task`, `delete-task`, `action-error` |
| Delete dialog    | `confirm-dialog`, `confirm-delete`, `cancel-delete`                                                                                                                                                                  |
| Create/Edit form | `task-form`, `field-{title,description,priority,status,dueDate}`, `field-{name}-error`, `form-error`, `save-task`, `cancel-form`                                                                                     |

## Mobile test identifiers

Build and run steps are in `apps/mobile/README.md`. The package and bundle ID is `dev.taskflow.app`, a placeholder. React Native `testID` values appear as `resource-id` on Android and accessibility identifiers on iOS.

Mobile uses the web identifiers above where the element is the same, with these differences:

| Area      | Mobile values                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Dashboard | `load-more`, `load-more-error` replace `previous-page`, `next-page`, and `page-indicator`                               |
| Sort      | `task-sort` is a toggle button labelled Soonest first or Latest first                                                   |
| Details   | Delete confirmation is a native alert with buttons Keep task and Delete task, so it has no `testID`                     |
| Form      | `field-priority-{LOW,MEDIUM,HIGH}`, `field-status-{PENDING,IN_PROGRESS,COMPLETED}`, `clear-due-date`, `due-date-picker` |

Android may display alert button text in capitals. The Android emulator reaches a host API at `10.0.2.2`.

Deep links: `taskflow://tasks/{taskId}`. See `docs/DEEP_LINK_SPECIFICATION.md`, including the iOS simulator prompt.
