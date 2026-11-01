# Test Strategy

## Objectives

Prove correctness at the cheapest effective layer inside this repository, then validate representative end-to-end journeys externally on each client.

## Two testing scopes

The TaskFlow Automation repository independently validates TaskFlow as an external consumer. It does not import application code or rely on internal tests, and it uses only the public API, the user interfaces, and the documented test data setup commands. Passing internal tests never replaces external validation, and external tests never replace internal ones.

### Internal testing (this repository)

| Layer       | Tool                           | Scope                                                  |
| ----------- | ------------------------------ | ------------------------------------------------------ |
| Unit        | Vitest                         | Pure business rules, schemas, date calculations        |
| Unit (UI)   | Vitest + React Testing Library | Form, cards, filters, loading/error states             |
| Integration | Vitest + Supertest             | Routes, services, and repositories against test SQLite |

Supertest route integration tests run inside this repository and call the app directly. They are not external API automation.

Mobile component tests may use `jest-expo` if Phase 4 confirms Vitest is unsuitable.

### External automation (TaskFlow Automation repository)

| Layer       | Tool                         | Scope                          |
| ----------- | ---------------------------- | ------------------------------ |
| API         | PactumJS                     | HTTP contract and behavior     |
| Web E2E     | Playwright                   | Browser user journeys          |
| Android E2E | Appium + WebdriverIO + Mocha | Native Android user journeys   |
| iOS E2E     | Appium + WebdriverIO + Mocha | Native iOS user journeys       |
| Performance | k6                           | API load and response behavior |

None of these tools, or their suites, belong in this repository.

## Core business test matrix

- Title required, trim whitespace, 3 and 100 character boundaries, 2 and 101 invalid.
- Description optional, 500 valid, 501 invalid.
- Priority enum validation.
- Status enum validation and approved transitions.
- Due date: today valid; past date invalid on create; editing an existing overdue task remains possible.
- Duplicate titles allowed.
- Prevent double-submit in UI.
- Overdue calculation excludes completed tasks.

## Critical end-to-end journeys (external)

1. Create task and verify it in dashboard and API.
2. Edit task title/priority and verify persistence.
3. Change status through the supported lifecycle.
4. Reopen a completed task.
5. Delete task and verify API returns 404.
6. Launch task detail through a deep link.
7. Submit invalid form and verify no record is created.
8. Handle API unavailable/error state and recover with retry.

## Test data strategy

- Seed a small known dataset with stable identifiers in test environments.
- Use a test data factory for unique records in parallel suites.
- Clean up records created by tests.
- Avoid relying on test execution order.
- Do not share mutable records between parallel tests unless the test explicitly covers concurrency.

## Locator strategy

Web:

- Prefer role/name and label-based locators.
- Add `data-testid` for elements without stable semantic selectors or where a stable test contract is useful.
- Avoid brittle CSS structure and generated XPath.

React Native:

- Use accessible labels/roles and stable `testID`.
- Ensure controls have meaningful accessibility labels.
- Avoid selectors based on visual hierarchy or transient text where a stable identifier is warranted.

## Test reporting

This repository reports through CI logs and test output. The external repository owns Allure reports, Playwright traces, Appium logs, and other automation artifacts.

## Quality principles

- Do not use fixed sleeps when condition-based waits are available.
- Do not retry assertions to mask flaky behavior.
- Keep assertions meaningful and independent.
- Validate business rules in internal tests and representative user journeys externally.
