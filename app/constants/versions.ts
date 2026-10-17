// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The upstream Mattermost Mobile version this fork is based on.
//
// Antimatter Mobile has its own version numbers (nativeApplicationVersion, 0.9.0 for the first beta, set by the release
// workflow from the tag), which people see in About and in the stores. The servers and plugins such as Calls compare
// the mobile app's version against Mattermost Mobile versions, so everything a server reads gets this version instead,
// the same way the Antimatter server reports a Mattermost-compatible version: the "Mattermost Mobile/<version>"
// user agent, the session's mobile_version prop and the session attributes' client_version.
//
// Raise it when an upstream Mattermost Mobile release is merged, never lower it.
export const COMPATIBLE_MATTERMOST_MOBILE_VERSION = '2.45.0';

export const GM_AS_DM_VERSION = [9, 1, 0];

export const PROPERTY_FIELDS_SEARCH_VERSION = [11, 10, 0];

// Server version where a promoted feature flag is removed from the client config (MM-69218). Mobile
// treats the feature as always-on at or after this version, and honors the flag on older servers that
// still send it (see @queries/servers/features). One constant per flag so the pattern is easy to copy;
// each must track its own server-side removal release, and the compat shim can be deleted once
// MIN_REQUIRED_VERSION reaches it (guarded by a test in features.test.ts).
export const CHANNEL_BOOKMARKS_FLAG_REMOVED_VERSION = [11, 10, 0];
export const CUSTOM_PROFILE_ATTRIBUTES_FLAG_REMOVED_VERSION = [11, 10, 0];

export const OS_VERSION = {
    ANDROID: 'android',
    IOS: 'ios',
};

export const ANDROID_33 = 33;
