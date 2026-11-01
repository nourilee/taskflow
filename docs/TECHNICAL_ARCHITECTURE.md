# Technical Architecture

## Architecture summary

A TypeScript monorepo with separate web and native mobile clients, a shared API, and a relational database.

## Stack

| Area               | Decision                                 |
| ------------------ | ---------------------------------------- |
| Workspace          | pnpm workspaces                          |
| Task orchestration | Turborepo                                |
| Web                | React + Vite + TypeScript                |
| Mobile             | React Native + Expo + TypeScript         |
| API                | Node.js + Express + TypeScript           |
| Database           | SQLite (from Phase 2; see ADR-006)       |
| ORM                | Prisma                                   |
| Validation         | Zod                                      |
| API documentation  | OpenAPI / Swagger UI                     |
| Unit tests         | Vitest                                   |
| Component tests    | React Testing Library                    |
| Integration tests  | Vitest + Supertest                       |
| Mobile navigation  | Expo Router                              |
| Mobile unit tests  | jest-expo + React Native Testing Library |
| CI/CD              | GitHub Actions                           |

## Repository layout

```text
taskflow/
  apps/
    web/
    mobile/
    api/
  packages/
    shared/          # domain types, schemas, business rules
    api-client/      # typed API client
  docs/
  prompts/
  .github/workflows/
  pnpm-workspace.yaml
  turbo.json
  package.json
  AGENTS.md
  README.md
```

## Boundaries

- `apps/web`: browser-specific routing, presentation, and web interaction.
- `apps/mobile`: native navigation, native presentation, deep-link handling.
- `apps/api`: HTTP routing, request validation, services, persistence, OpenAPI.
- `packages/shared`: domain types, schemas, pure business rules.
- `packages/api-client`: shared typed transport client and API error handling.
- Tests live inside their application package. External automation lives in the TaskFlow Automation repository.

## API request flow

Client → API client → Express route/controller → Zod validation → service/business rules → Prisma repository → SQLite.

Keep controllers thin. Put business rules in service/domain functions. Keep database access behind repository functions or a clearly separated persistence layer.

## Data and environments

- Local development database as a SQLite file, added in Phase 2.
- Separate SQLite test database file for automated tests, added in Phase 2.
- Never run reset/seed test utilities against development data unless explicitly intended.
- Use environment variables and provide `.env.example`.
- Store no secrets in source control.

## Time and dates

Represent due dates as calendar dates, not timestamps, unless a time-of-day feature is introduced. Store audit timestamps in UTC. Decide "today" from `APP_TIMEZONE` (default UTC). Inject a reference date/clock into overdue calculations to avoid tests depending on the actual current date.

## Native build approach

Use Expo development/native builds and EAS Build when needed. APK creation is supported through Android build profiles. A distributable iOS IPA requires Apple Developer signing and provisioning; simulator builds are not equivalent to an installable IPA for a physical device.

## Deep link domains

Use a configurable example domain during development. Do not assume `app.taskflow-demo.com` is owned or configured. Replace it with a domain you control before verifying HTTPS Universal Links/App Links.
