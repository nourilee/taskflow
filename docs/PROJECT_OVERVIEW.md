# Project Overview

## Vision

TaskFlow is a lightweight task management application created as an SDET engineering showcase. Its purpose is to provide a realistic but deliberately small system that can be developed, tested, automated, deployed, and demonstrated end to end.

## Product goals

- Provide a useful task CRUD experience without credentials.
- Run on web, Android, and iOS.
- Expose a documented REST API.
- Support direct navigation to a task through deep links.
- Make behavior deterministic and observable for automated testing.
- Demonstrate testing from unit level through CI/CD regression.

## Non-goals

No accounts, authentication, collaboration, reminders, attachments, recurring tasks, or complex offline synchronization in the initial release.

## Users and primary journey

A user opens TaskFlow and immediately sees the dashboard. They can create a task, open its details, change its status, edit it, or delete it. The same task data is available through the web and mobile clients because all clients use the same API and database.

## Product principles

- Small scope, realistic behavior.
- Accessible and consistent interactions.
- Server-side validation is authoritative.
- Shared domain rules across clients where practical.
- Deterministic test data and isolated environments.
- Automation-friendly without building a test-only UI.
