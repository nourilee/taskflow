# Design System

TaskFlow's visual language for web, Android, and iOS. Values live in `packages/design-tokens`, the single source. Web reads them as CSS variables from the generated `tokens.css`. Mobile imports them from TypeScript. Do not hardcode a theme color in a component.

## Brand

Colorful, friendly, and organized. Each color has one job:

| Color  | Hex       | Meaning                                         |
| ------ | --------- | ----------------------------------------------- |
| Violet | `#7955E8` | Brand, primary actions, selection, focus        |
| Amber  | `#FFBD59` | Pending                                         |
| Blue   | `#5B9CF5` | In progress                                     |
| Teal   | `#21BFA6` | Completed                                       |
| Coral  | `#FF718B` | Urgency: overdue, high priority, errors, delete |

The flow bar under the summary cards is the signature element. It shows the share of tasks in each status and repeats the counts visually, so it is hidden from assistive technology.

The logo is a violet tile with a white check ending in a coral dot. Sources: `apps/web/public/favicon.svg`, `apps/web/src/components/Logo.tsx`, `apps/mobile/src/components/Logo.tsx`, and `apps/mobile/assets/`.

## Theme tokens

The accent hues measure 1.66:1 to 2.79:1 on white, so they are fills only. Text uses the deeper shades below.

| Token                      | Light                 | Dark                  |
| -------------------------- | --------------------- | --------------------- |
| `background`               | `#F7F6FC`             | `#171624`             |
| `surface`                  | `#FFFFFF`             | `#242235`             |
| `surfaceHover`             | `#F1EEFA`             | `#2E2B42`             |
| `text`                     | `#29243B`             | `#F3F0FA`             |
| `textMuted`                | `#625C78`             | `#ADA7C2`             |
| `border`                   | `#E9E5F3`             | `#39354C`             |
| `borderControl`            | `#8A84A0`             | `#8A84A0`             |
| `primary` / `onPrimary`    | `#7955E8` / `#FFFFFF` | `#A58BFF` / `#171624` |
| `primaryHover`             | `#6A45DE`             | `#B7A2FF`             |
| `primaryTint`              | `#EFEAFD`             | `#322C55`             |
| `primaryText`              | `#6A45DE`             | `#A58BFF`             |
| `pending` / tint           | `#8F5A00` / `#FFF3DF` | `#FFCF85` / `#3B3026` |
| `inProgress` / tint        | `#2A62BE` / `#E9F2FE` | `#93BEFA` / `#26304A` |
| `completed` / tint         | `#0B7566` / `#E2F7F3` | `#5FDCC6` / `#1E3A3C` |
| `danger` / tint            | `#B4254B` / `#FFEDF1` | `#FF9DB0` / `#3D2636` |
| `dangerSolid` / `onDanger` | `#B4254B` / `#FFFFFF` | `#FF9DB0` / `#171624` |

`packages/design-tokens/src/tokens.test.ts` fails the build if a text pair drops below 4.5:1 or an input border below 3:1. Add new pairs there.

## Scales

| Scale     | Values                                                     |
| --------- | ---------------------------------------------------------- |
| Spacing   | 4, 8, 12, 16, 24, 32 (`xs` to `xxl`)                       |
| Radius    | 8 for controls, 12 for cards, 999 for pills                |
| Font size | 12, 14, 16, 20, 24, 32, with line heights in `tokens.ts`   |
| Font      | Inter: variable font on web, four static weights on mobile |
| Touch     | 44 minimum                                                 |
| Shadow    | Light theme only. Dark surfaces use a border               |
| Icons     | Lucide, marked decorative on web                           |

## Theme behavior

Preferences are Light, Dark, and System, defaulting to System. The key is `taskflow.theme`.

- **Web:** an inline script in `index.html` sets `data-theme` on `<html>` before first paint. `useTheme` stores changes in `localStorage` and follows the operating system in System mode. Changing theme swaps CSS variables only. A test runs the script from the real `index.html`.
- **Mobile:** `ThemeProvider` reads AsyncStorage and the root layout holds the splash screen until the preference and fonts are ready. `Appearance.setColorScheme` keeps native alerts and date pickers in step. On Android, a mode set during launch does not reach the activity, so `refreshNativeAppearance` cycles it after the splash screen hides. `plugins/with-android-accent.js` gives Android dialogs the primary color, and a test keeps it equal to the tokens. iOS date pickers use the primary color. iOS alerts keep the system blue and red, as is platform convention. `makeStyles` caches one stylesheet per theme, so nothing remounts.

## Components

| Component             | Web                                                                 | Mobile                                                 |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| Button                | `.button`, `.button-quiet`, `.button-danger`, `.button-danger-text` | `Button` with `solid`, `quiet`, `danger`               |
| Input                 | `.field`                                                            | `useSharedStyles().input`, `FieldLabel`                |
| Card                  | `.summary-card`, `.task-list`, `.details`                           | Screen styles with `cardShadow`                        |
| Status badge          | `StatusBadge`                                                       | `StatusBadge`                                          |
| Priority indicator    | `PriorityIndicator`                                                 | `PriorityIndicator`                                    |
| Overdue badge         | `OverdueBadge`                                                      | `OverdueBadge`                                         |
| Confirmation          | `ConfirmDialog`                                                     | Native `Alert`                                         |
| Loading, empty, error | `Loading`, `LoadError`, `Notice`, `TaskNotFound`                    | `Loading`, `LoadError`, `TaskNotFound`, `notice` style |
| Theme control         | `ThemeSwitcher`                                                     | `AppearanceButton`, `AppearanceSheet`                  |

## Rules

- Color is never the only signal. Every status and priority has its own icon and text.
- Status icons: circle for Pending, dashed circle for In progress, check circle for Completed. Priority icons: chevron down for Low, minus for Medium, double chevron up for High.
- Web focus is a 3px primary outline. Motion is limited to short state changes and spinners, and `prefers-reduced-motion` removes transitions and slows spinners.
- Set an explicit `height` on web inputs and selects, because iOS Safari ignores `min-height` on native controls.
- Visible "Required" and "Optional" markers are hidden from assistive technology, so field names stay stable.
- Web layout: sidebar from 64rem, top bar below, and two summary columns from 36rem down. One DOM serves every width, so test identifiers are never duplicated.
- Mobile uses a native stack with a floating Create task action. It has no tabs, because the app has one top-level destination.
