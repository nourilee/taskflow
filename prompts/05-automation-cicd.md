# Claude Code Prompt — Phase 5: Automation and CI/CD

Read `AGENTS.md`, test strategy, and CI/CD strategy.

Implement automation suites and GitHub Actions incrementally:

- Vitest unit/component/integration suites.
- PactumJS API suite.
- Playwright web E2E.
- Appium + WebdriverIO + Mocha mobile E2E.
- k6 API performance smoke test.
- Allure reporting and failure artifacts.

Pipeline triggers:

- PR: lint, typecheck, unit/component, API smoke, web smoke.
- Main: API and web regression.
- Nightly: web, Android, iOS regression and performance smoke.
- Release: quality gates and platform builds.

Use isolated test data and avoid shared mutable records in parallel tests. Use condition-based waits rather than fixed sleeps. Never weaken assertions to make a pipeline green. Keep secrets in GitHub Actions secrets.

Present a plan before editing. Run what is feasible locally and clearly distinguish locally verified behavior from CI-only configuration.
