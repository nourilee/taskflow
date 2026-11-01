# Claude Code Prompt — Phase 4: Mobile Client

Read `AGENTS.md`, requirements, architecture, deep-link, and test strategy documents.

Implement the React Native + Expo mobile app with exactly the same three primary screens and business behavior as the web client. Connect to the real API through the shared API client.

Requirements:

- Native navigation.
- Custom URL scheme `taskflow://tasks/{taskId}`.
- Cold-start, warm-start, and background deep-link handling.
- Stable `testID` values and meaningful accessibility labels.
- Loading, empty, error, retry, validation, and not-found states.
- Native date picker and platform-appropriate controls.
- Configure native builds so Appium can automate installed app binaries.

Do not claim verified Universal Links/App Links until a real domain and association files are configured. Do not claim a distributable iOS IPA without signing/provisioning.

Add or update mobile component/unit tests where practical and Appium/WebdriverIO smoke tests. Present a plan first and report actual build/test results.
