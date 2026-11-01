# Claude Code Prompt — Phase 5: Application CI/CD

Read `AGENTS.md` and `docs/CI_CD_STRATEGY.md`.

Implement this repository's GitHub Actions workflows incrementally. They run only unit tests, integration tests, code quality checks, type checks, and application builds.

Pipeline triggers:

- PR: format check, lint, typecheck, unit tests, integration tests, builds.
- Main: the same checks.
- Release: quality gates and platform builds.

External automation belongs to the TaskFlow Automation repository. Do not add it here. Never weaken assertions to make a pipeline green. Keep secrets in GitHub Actions secrets.

Present a plan before editing. Run what is feasible locally and clearly distinguish locally verified behavior from CI-only configuration.
