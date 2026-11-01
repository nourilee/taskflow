# Deep Link Specification

## Routes

- Custom scheme: `taskflow://tasks/{taskId}`
- HTTPS: `https://{owned-domain}/tasks/{taskId}`

The HTTPS host is a placeholder until a domain controlled by the project owner is configured.

## Expected behavior

| Starting state        | Link                | Expected behavior                                |
| --------------------- | ------------------- | ------------------------------------------------ |
| App closed            | Valid task          | Launch app and show task details                 |
| App foreground        | Valid task          | Navigate to task details without duplicate route |
| App background        | Valid task          | Resume and show task details                     |
| Any state             | Unknown task        | Show not-found state                             |
| Any state             | Malformed link      | Safe fallback to dashboard                       |
| Desktop browser       | HTTPS task link     | Open web task details                            |
| Mobile browser/device | Verified HTTPS link | Open app when OS association is configured       |

## Platform configuration

- Web: React Router route `/tasks/:taskId`.
- Android: intent filter for custom scheme; Android App Links verification using `assetlinks.json`.
- iOS: URL scheme and Associated Domains entitlement; host an `apple-app-site-association` file.
- Expo: configure scheme and native linking settings; verify generated native configuration.

## Test scenarios

- Valid and invalid IDs.
- Malformed path and missing ID.
- Cold start, warm start, and background resume.
- Duplicate link invocation.
- Link received while another screen is open.
- HTTPS association verified on actual device.
- Fallback behavior when app is not installed.

## Implementation status

- **Web:** `/tasks/{taskId}` is implemented. Unknown paths redirect to the dashboard.
- **Mobile custom scheme:** `taskflow://tasks/{taskId}` is implemented through Expo Router. Unknown tasks show not-found, and malformed links fall back to the dashboard.
- **HTTPS App Links and Universal Links:** not configured, because no domain is owned yet.

On the iOS simulator, `xcrun simctl openurl` shows an `Open in "TaskFlow"?` prompt for this custom scheme, even when the app is in the foreground. Tap Open to continue, or allow for that step in automation.

## Important setup note

Universal Links and verified Android App Links require a real HTTPS domain, correct hosting, and platform association files. A custom scheme can be tested locally without owning a domain, but it is not a substitute for verified HTTPS links.
