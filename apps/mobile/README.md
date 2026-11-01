# TaskFlow Mobile

Placeholder Expo app for Phase 1. `pnpm build` exports the Android and iOS JavaScript bundles. It does not produce an APK or IPA; native builds arrive in Phase 4.

## Expo SDK 58 compatibility

Compared against `expo-template-blank-typescript@58.0.31` on 2026-11-01. Expo Doctor 1.21.5 reported 20/20 checks passed, with no discrepancies to resolve.

| Package           | Template   | This app            |
| ----------------- | ---------- | ------------------- |
| `expo`            | `~58.0.22` | `~58.0.22`          |
| `expo-status-bar` | `~58.0.4`  | `~58.0.4`           |
| `react`           | `19.3.0`   | `19.3.0` (catalog)  |
| `react-native`    | `0.88.1`   | `0.88.1`            |
| `@types/react`    | `~19.3.0`  | `~19.3.0` (catalog) |
| `typescript`      | `~6.0.3`   | `~6.0.3` (catalog)  |

Deliberate differences from the template:

- `app.json` adds the `taskflow` scheme and omits icon, splash, and web settings, because Phase 1 has no app assets.
- `expo start --web` is not included, because the web client is `apps/web`.
- `dev` replaces the template's `start` script so Turborepo can run it.
- There is no test runner yet; Phase 4 selects one.

No custom Metro config or `node-linker` setting is needed. The app bundles with pnpm's default isolated layout.

Expo packages published within pnpm's minimum release age are listed by exact version under `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`. Remove those entries once they are older than that window.
