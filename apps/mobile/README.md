# TaskFlow Mobile

Expo app with the same three screens and rules as the web client: Dashboard, Task Details, and Create/Edit Task. It uses Expo Router and the shared `@taskflow/shared` and `@taskflow/api-client` packages.

## Run on a simulator or emulator

Native folders (`android/`, `ios/`) are generated and gitignored. Create `apps/mobile/.env`, because Expo reads env files from this folder, not the repository root:

```sh
# iOS simulator
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
# Android emulator: use http://10.0.2.2:3000/api/v1 instead
```

Without it, the app defaults to those same addresses for each platform. The URL is set at build time, so rebuild after changing it.

Start the API from the repository root, then build and run:

```sh
pnpm --filter @taskflow/api dev
pnpm --filter @taskflow/mobile exec expo run:android --variant release --no-bundler
pnpm --filter @taskflow/mobile exec expo run:ios --configuration Release --device "iPhone 16" --no-bundler
```

`pnpm build` only exports JavaScript bundles. It does not produce an APK or IPA.

### Tool requirements

- CocoaPods, Xcode, and an iOS simulator. If Xcode is not the selected developer directory, set `DEVELOPER_DIR` for these commands.
- Android SDK and an emulator. Gradle downloads missing SDK and NDK parts.
- A Java version Gradle accepts. This project was built with Android Studio's bundled JDK 25 through `JAVA_HOME`; the default Java 26 was not tried.
- Native builds and SDK downloads need 20 GB or more of free disk space.

With Xcode 27, `expo run:ios` can finish with a System Events error after `Build Succeeded`. It comes from bringing the simulator window forward. The app is already installed at that point.

## Build profiles

`eas.json` defines `android-apk` and `ios-simulator`. Neither has been run, because no EAS account is configured. An installable device IPA needs Apple signing and provisioning.

## Local HTTP

`expo-build-properties` allows cleartext HTTP on Android so the emulator can reach a local API. Remove this before any public release. The bundle IDs in `app.json` (`dev.taskflow.app`) are placeholders.

## Tests

`pnpm --filter @taskflow/mobile test` runs `jest-expo` with React Native Testing Library. `expo-router` is mocked, so route files, native alerts, the native date picker, and theme changes in native UI need checking on a device.

After changing a native dependency or `app.json`, run `pnpm --filter @taskflow/mobile exec expo prebuild --clean --no-install` before building.

If an Android build fails with `cannot find symbol` for `RNGestureHandlerPackage`, the module's output is stale. Run `./gradlew :react-native-gesture-handler:clean` from `android/` and build again.

## Expo SDK 58 compatibility

Dependencies match `expo install` for SDK 58 and the `expo-template-blank-typescript@58.0.31` template. Icons and the splash image are in `assets/`. Expo packages inside pnpm's minimum release age are listed by exact version under `minimumReleaseAgeExclude` in `pnpm-workspace.yaml`; remove those entries once they age out.
