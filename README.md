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

## Reporting problems

See [antimatter.chat/help.html](https://antimatter.chat/help.html), or open an issue on
[GitHub](https://github.com/AntimatterChat/mobile-app/issues) with the device, the steps to reproduce, what you
saw and what you expected.

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
