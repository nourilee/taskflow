# CI/CD Strategy

## Pull request pipeline

Run fast feedback checks:

1. Install dependencies with frozen lockfile.
2. Lint and format check.
3. Typecheck.
4. Unit and component tests.
5. Build affected apps/packages.
6. API smoke tests against an isolated test database.
7. Web smoke tests where practical.

## Main branch pipeline

- Full unit/component suite.
- API and integration regression.
- Playwright web regression.
- Publish reports and diagnostics.
- Build web and API artifacts.

## Nightly pipeline

- Full web regression.
- Android emulator/Appium suite.
- iOS simulator/Appium suite on macOS runner.
- Optional BrowserStack execution when credentials are configured.
- k6 performance smoke/load profile.
- Publish Allure and platform artifacts.

## Release pipeline

- Require successful quality gates.
- Build production web/API.
- Build Android APK.
- Build iOS IPA only when Apple signing and provisioning are configured.
- Publish artifacts securely.
- Deploy only through explicitly configured environments and approvals.

## Secrets

Use GitHub Actions secrets/environment secrets for:

- BrowserStack credentials
- deployment credentials
- EAS access token if used
- Apple signing-related secrets where applicable

Never put secrets in workflow YAML, source files, documentation examples, or committed `.env` files.

## Runner considerations

- Web/API/unit tests can run on Linux runners.
- Android emulator tests can run on suitable Linux runners, subject to emulator/KVM availability.
- iOS simulator and IPA signing/builds require macOS tooling.
- Real-device testing may use a device cloud such as BrowserStack.
