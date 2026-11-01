# CI/CD Strategy

This repository's CI/CD runs only unit tests, integration tests, code quality checks, type checks, and application builds. The TaskFlow Automation repository owns its own pipelines for API automation, web and mobile E2E, performance, cross-browser and cross-device testing, regression, and reporting. Those pipelines test published builds or a checked-out revision of this repository.

## Pull request pipeline

1. Install dependencies with frozen lockfile.
2. Format check and lint.
3. Typecheck.
4. Unit tests.
5. Integration tests against an isolated test database.
6. Build applications and packages.

## Main branch pipeline

Runs the same checks as the pull request pipeline.

## Release pipeline

- Require successful quality gates.
- Build production web/API.
- Build Android APK.
- Build iOS IPA only when Apple signing and provisioning are configured.
- Publish artifacts securely.
- Deploy only through explicitly configured environments and approvals.

## Secrets

Use GitHub Actions secrets/environment secrets for:

- deployment credentials
- EAS access token if used
- Apple signing-related secrets where applicable

Never put secrets in workflow YAML, source files, documentation examples, or committed `.env` files.

## Runner considerations

- Web/API/unit/integration work can run on Linux runners.
- iOS IPA signing and builds require macOS tooling.
