# UI Component and Locator Inventory

The stable identifier contract for the TaskFlow Automation repository and the V2 self-healing demonstrations. This is the single source for identifiers. Existing values must not be renamed or removed without owner approval. New values are additive.

- **Web** identifiers are `data-testid`. **Mobile** identifiers are `testID`, which appear as `resource-id` on Android and accessibility identifiers on iOS.
- `{id}` is the task ID. It never comes from a title or other editable text.
- `{status}` is `all`, `pending`, `in-progress`, or `completed`, except where noted.
- Prefer role and label locators where available. Theme changes never alter an identifier, and only web's `data-theme` attribute on `<html>` reports the active theme (`light` or `dark`).

## App shell

| Component            | Identifier                         | Platform    |
| -------------------- | ---------------------------------- | ----------- |
| Logo and app name    | `app-title`                        | Web, Mobile |
| Dashboard navigation | `nav-dashboard`                    | Web         |
| Theme switcher group | `theme-switcher`                   | Web         |
| Theme option         | `theme-option-{light,dark,system}` | Web, Mobile |
| Open appearance      | `open-appearance`                  | Mobile      |
| Appearance sheet     | `appearance-sheet`                 | Mobile      |
| Close appearance     | `close-appearance`                 | Mobile      |

## Shared states

| Component         | Identifier          | Platform    |
| ----------------- | ------------------- | ----------- |
| Loading           | `loading`           | Web, Mobile |
| Load error        | `load-error`        | Web, Mobile |
| Retry             | `retry`             | Web, Mobile |
| Task not found    | `task-not-found`    | Web, Mobile |
| Back to dashboard | `back-to-dashboard` | Web, Mobile |

## Dashboard

| Component          | Identifier                   | Platform    |
| ------------------ | ---------------------------- | ----------- |
| Create task        | `create-task`                | Web, Mobile |
| Search             | `task-search`                | Web, Mobile |
| Sort               | `task-sort`                  | Web, Mobile |
| Status filter card | `status-filter-{status}`     | Web, Mobile |
| Summary count      | `dashboard-summary-{status}` | Web, Mobile |
| Task list          | `task-list`                  | Web, Mobile |
| Task card          | `task-card-{id}`             | Web, Mobile |
| Overdue badge      | `task-overdue-{id}`          | Web, Mobile |
| Empty state        | `empty-state`                | Web, Mobile |
| No results         | `no-results`                 | Web, Mobile |
| Clear filters      | `clear-filters`              | Web, Mobile |
| Previous page      | `previous-page`              | Web         |
| Next page          | `next-page`                  | Web         |
| Page indicator     | `page-indicator`             | Web         |
| Load more          | `load-more`                  | Mobile      |
| Load more error    | `load-more-error`            | Mobile      |

On web, `task-sort` is a select with values `asc` and `desc`. On mobile, it is a toggle button labelled Soonest first or Latest first.

## Task Details

| Component      | Identifier                                      | Platform    |
| -------------- | ----------------------------------------------- | ----------- |
| Title          | `task-title`                                    | Web, Mobile |
| Status         | `task-status`                                   | Web, Mobile |
| Priority       | `task-priority`                                 | Web, Mobile |
| Due date       | `task-due-date`                                 | Web, Mobile |
| Description    | `task-description`                              | Web, Mobile |
| Created        | `task-created-at`                               | Web, Mobile |
| Updated        | `task-updated-at`                               | Web, Mobile |
| Overdue badge  | `task-overdue-{id}`                             | Web, Mobile |
| Status action  | `status-action-{pending,in-progress,completed}` | Web, Mobile |
| Edit           | `edit-task`                                     | Web, Mobile |
| Delete         | `delete-task`                                   | Web, Mobile |
| Action error   | `action-error`                                  | Web, Mobile |
| Delete dialog  | `confirm-dialog`                                | Web         |
| Confirm delete | `confirm-delete`                                | Web         |
| Cancel delete  | `cancel-delete`                                 | Web         |

Mobile delete confirmation is a native alert with the buttons Keep task and Delete task, so it has no `testID`. Android may display that text in capitals.

## Create/Edit Task

| Component         | Identifier                                     | Platform    |
| ----------------- | ---------------------------------------------- | ----------- |
| Form              | `task-form`                                    | Web, Mobile |
| Title input       | `field-title`                                  | Web, Mobile |
| Description input | `field-description`                            | Web, Mobile |
| Priority select   | `field-priority`                               | Web         |
| Status select     | `field-status`                                 | Web         |
| Priority choice   | `field-priority-{LOW,MEDIUM,HIGH}`             | Mobile      |
| Status choice     | `field-status-{PENDING,IN_PROGRESS,COMPLETED}` | Mobile      |
| Due date          | `field-dueDate`                                | Web, Mobile |
| Clear due date    | `clear-due-date`                               | Mobile      |
| Date picker       | `due-date-picker`                              | Mobile      |
| Field error       | `field-{name}-error`                           | Web, Mobile |
| Form error        | `form-error`                                   | Web, Mobile |
| Save              | `save-task`                                    | Web, Mobile |
| Cancel            | `cancel-form`                                  | Web, Mobile |

`{name}` is `title`, `description`, `priority`, `status`, or `dueDate`.

## Verified on devices

Dashboard and Task Details identifiers, including `task-status`, `task-priority`, and `task-overdue-{id}`, were read from the Android and iOS accessibility trees on release builds. Appium's XCUITest driver finds them on iOS by accessibility ID.

## Changes in the V1 redesign

No existing identifier was renamed or removed. These changes can still affect locators that do not use identifiers:

- The All card now reads Total tasks. Its accessible name on web is the count plus Total tasks. On mobile, it is `Total tasks, {count}`.
- On web, `cancel-form` moved from above the title to beside Save.
- On mobile, `create-task` is a floating button at the bottom right.
- `app-title` is new on mobile. The mobile header previously had no identifier.
