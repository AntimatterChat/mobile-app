# Antimatter Mobile

The iOS and Android app of [Antimatter](https://antimatter.chat), the free, open-source team chat you host
yourself. It is based on [Mattermost Mobile v2](https://github.com/mattermost/mattermost-mobile) and works with
Antimatter servers.

- **Supported iOS versions:** 18.0+
- **Supported Android versions:** 11.0+

Every feature is available: there is no licence, no edition and nothing to upgrade to.

## Building

See [CLAUDE.md](CLAUDE.md) for the commands (`npm run tsc`, `npm test`, `npm run ios`, `npm run android`) and the
architecture. The store builds go through fastlane (`fastlane/`), with the identifiers of `fastlane/.env.*`:

| | Android applicationId / iOS bundle id | App group (iOS) |
|---|---|---|
| Release | `chat.antimatter.app` (extensions: `.Share`, `.NotificationService`) | `group.chat.antimatter.app` |
| Beta | `chat.antimatter.app.beta` | `group.chat.antimatter.app.beta` |

The Kotlin/Java packages (`com.mattermost.*`) and the Swift modules keep their upstream names.

To build your own copy you need, besides the toolchains:

- your own signing keys (Android keystore, Apple certificates and provisioning profiles for the three iOS targets);
- a Firebase project for Android push notifications: replace `android/app/google-services.json`, which is a
  placeholder;
- an APNs key for iOS push notifications;
- a push proxy that holds those credentials ([AntimatterChat/push-proxy](https://github.com/AntimatterChat/push-proxy)),
  set as the push notification server of your Antimatter server.

The app icons and the launch screen are rendered from `assets/brand/*.svg` with
`python3 scripts/generate-brand-assets.py` (needs `rsvg-convert` and ImageMagick).

Deep links use the `antimatter://` scheme; `mattermost://` links keep working.

## Releases

The [release workflow](.github/workflows/release.yml) builds the apps on GitHub's runners: pushing a tag
`v<version>` (e.g. `v0.9.0`, or `v0.9.0-rc.1` for a prerelease) publishes them on the GitHub release of that tag,
with a `SHA256SUMS` file. Run by hand from the Actions tab, it keeps the files as workflow artifacts (and, if asked,
saves them as a draft prerelease) under the version `<package.json version>-dev.<run number>`. Nothing goes to the
App Store or Google Play.

- **Android**: `Antimatter-<version>.apk` to install, signed with the release key of the repository secrets
  `ANTIMATTER_ANDROID_KEYSTORE` (the keystore, base64), `ANTIMATTER_ANDROID_KEYSTORE_PASSWORD`,
  `ANTIMATTER_ANDROID_KEY_ALIAS` and `ANTIMATTER_ANDROID_KEY_PASSWORD` (the keystore password when unset), with the
  signed `Antimatter-<version>.aab`. Without those secrets the installable APK is
  `Antimatter-<version>-debug-signed.apk`, signed with the public debug key, and the AAB is unsigned.
  `Antimatter-<version>-unsigned.apk` is for signing with your own key. Android only updates an app from an APK signed
  with the same key: to switch between builds signed differently (a debug-signed build, a release-signed one, your
  own), uninstall the app first, which deletes its data.
- **iOS**: `Antimatter-<version>-unsigned.ipa`, built without code signing: sign it with your own certificate and
  provisioning profiles (or a sideloading tool) to install it, and `Antimatter-<version>-simulator-arm64.app.zip` for
  the iOS simulator.
- Android push notifications need your Firebase project: put its `google-services.json` in the
  `ANTIMATTER_GOOGLE_SERVICES_JSON` secret (otherwise the placeholder is used and push doesn't work). The version code
  and build number come from `android/app/build.gradle` and the Xcode project: raise them with the version, and never
  lower them (Android and the stores refuse an update with a lower version code or build number).

Antimatter Mobile versions start at 0.9.0: the tag's version is the one people see in About (iOS takes its numbers
only, so `0.9.0-rc.1` shows as 0.9.0 there). Servers and plugins compare the mobile app's version against Mattermost
Mobile versions, so the app tells them the Mattermost Mobile version it is based on
(`COMPATIBLE_MATTERMOST_MOBILE_VERSION` in `app/constants/versions.ts`), in its `Mattermost Mobile/<version>` user
agent, the session's `mobile_version` and the session attributes' `client_version`.

## Documentation

The user guide covers [the desktop and mobile apps](https://antimatter.chat/docs/users/index.html#apps) on
[antimatter.chat/docs](https://antimatter.chat/docs/).

## Feedback and support

Found a bug in the mobile app, or missing a feature? Please [open an
issue](https://github.com/AntimatterChat/community/issues/new/choose) in the [Antimatter community
repository](https://github.com/AntimatterChat/community), where the feedback for every part of
Antimatter is gathered. Questions and ideas are welcome in its
[Discussions](https://github.com/AntimatterChat/community/discussions). When you report a problem,
please mention your device, the app version, the steps to reproduce, what you saw and what you
expected. More help is on [antimatter.chat/help.html](https://antimatter.chat/help.html). Please
report security problems privately, as explained in the [security
policy](https://github.com/AntimatterChat/.github/blob/main/SECURITY.md).

## Troubleshooting

### "Cannot connect to the server. Please check your server URL and internet connection."

This usually comes from the SSL certificate configuration. Check the certificate with a site such as
https://www.ssllabs.com/ssltest/index.html: if it reports a missing chain or certificate path, an intermediate
certificate is missing. The apps cannot connect to servers with self-signed certificates; use
[Let's Encrypt](https://letsencrypt.org) instead.

### A "Connecting…" bar that does not go away

If the server is behind NGINX or another reverse proxy, the proxy must let the websocket connection of
`/api/v4/websocket` through (the `Upgrade` and `Connection` headers).

## Licence

Apache 2.0, see [LICENSE.txt](LICENSE.txt) and [NOTICE.txt](NOTICE.txt). Mattermost Mobile is copyright
Mattermost, Inc.
