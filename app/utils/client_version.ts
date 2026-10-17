// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {nativeBuildVersion} from 'expo-application';
import {modelName, osName, osVersion} from 'expo-device';

import {COMPATIBLE_MATTERMOST_MOBILE_VERSION} from '@constants/versions';

// What the servers read: they compare it against Mattermost Mobile versions, so it is the compatible version, never
// Antimatter's own nativeApplicationVersion (which About and the stores show)

// The version a server stores in the session's mobile_version prop
export const getServerMobileVersion = () => COMPATIBLE_MATTERMOST_MOBILE_VERSION;

// The session attributes' client_version, with the build number like upstream
export const getServerClientVersion = () => {
    return nativeBuildVersion ? `${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+${nativeBuildVersion}` : COMPATIBLE_MATTERMOST_MOBILE_VERSION;
};

// The user agent of every request to a server: servers and plugins recognise the app by "Mattermost Mobile/<version>"
export const getServerUserAgent = () => {
    return `Mattermost Mobile/${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+${nativeBuildVersion} (${osName}; ${osVersion}; ${modelName})`;
};
