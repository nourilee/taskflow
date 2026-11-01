# Functional Requirements and Acceptance Criteria

## 1. Task model

A task has:

- `id`: server-generated unique identifier
- `title`: required string, trimmed, 3–100 characters
- `description`: optional string, maximum 500 characters
- `priority`: `LOW`, `MEDIUM`, or `HIGH`
- `status`: `PENDING`, `IN_PROGRESS`, or `COMPLETED`
- `dueDate`: optional calendar date (`YYYY-MM-DD`)
- `createdAt`: server timestamp
- `updatedAt`: server timestamp

Duplicate titles are allowed. Do not impose title uniqueness.

## 2. Dashboard

### Requirements

- Show tasks in a useful list.
- Show summary counts for all, pending, in-progress, and completed tasks.
- Filter by status: All, Pending, In Progress, Completed.
- Search by title (case-insensitive substring match).
- Sort by due date, with tasks without due dates consistently placed last.
- Indicate overdue tasks when due date is before the current local calendar date and status is not completed.
- Provide an empty state when there are no tasks.
- Provide a no-results state when search/filter returns no tasks.
- Provide retry behavior when loading fails.
- Provide a clear route/action to create a task.

### Acceptance criteria

- Given tasks exist, when the dashboard loads, then task cards and summary counts reflect API data.
- Given a status filter is selected, when the user applies it, then only matching tasks are shown.
- Given a search term, when the user searches, then matching titles are shown case-insensitively.
- Given an overdue incomplete task, when displayed, then it is visibly marked overdue.
- Given the API is unavailable, when the dashboard loads, then an understandable error and retry action appear.

## 3. Task details

### Requirements

- Display all task fields.
- Allow editing.
- Allow status changes.
- Allow deletion with confirmation.
- Provide navigation back to the dashboard.
- Display a not-found state for unknown/deleted task IDs.
- On update failure, preserve the user's current form/state and show an error.

### Status behavior

- `PENDING` → `IN_PROGRESS`: allowed
- `IN_PROGRESS` → `COMPLETED`: allowed
- `COMPLETED` → `PENDING`: allowed (reopen)
- Other transitions should be evaluated against the same explicit rule set; the initial implementation may permit direct transitions only if the product owner approves. Prefer the simplest consistent rule and test it.

## 4. Create/Edit form

### Fields

- Title: required, trimmed, 3–100 characters.
- Description: optional, maximum 500 characters.
- Priority: LOW, MEDIUM, HIGH; default MEDIUM.
- Due date: optional calendar date.
- Status: PENDING, IN_PROGRESS, COMPLETED; default PENDING for new tasks.

### Validation and behavior

- Reject blank titles.
- Trim leading and trailing title whitespace.
- Duplicate titles are permitted.
- Due date cannot be earlier than the current date when creating a task.
- Editing an existing overdue task must remain possible; do not block saving solely because its existing due date is in the past.
- Prevent duplicate submissions while a save is in progress.
- Display field-level validation errors.
- Server validation must enforce the same rules.
- A successful create/update returns to task details or dashboard consistently across platforms.

## 5. Cross-platform requirements

- Web: responsive browser experience.
- Android: installable native build (APK for portfolio testing).
- iOS: native build and IPA distribution when Apple signing/provisioning is available.
- All clients use the same backend and task data.
- Support loading, empty, error, validation, and not-found states.
- Use accessible labels and stable automation identifiers.

## 6. Quality and testability requirements

- Web: stable `data-testid` for key interactive elements.
- React Native: stable `testID` and accessibility labels/roles.
- Seed script creates repeatable, documented sample records.
- Test reset utility is restricted to test environment and test database.
- API exposes health check and OpenAPI documentation.
- Error responses use a consistent structure.
- Business logic accepts a reference date/clock so date behavior can be tested deterministically.
