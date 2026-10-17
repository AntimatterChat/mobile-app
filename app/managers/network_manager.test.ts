// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getOrCreateAPIClient} from '@mattermost/react-native-network-client';

import {HEADER_USER_AGENT} from '@client/rest/constants';
import {COMPATIBLE_MATTERMOST_MOBILE_VERSION} from '@constants/versions';

import NetworkManager from './network_manager';

jest.mock('expo-application', () => ({
    nativeApplicationVersion: '0.9.0',
    nativeBuildVersion: '821',
    applicationName: 'Antimatter',
    applicationId: 'chat.antimatter.app',
}));

describe('managers/network_manager', () => {
    const serverUrl = 'https://chat.example.com';

    afterEach(() => {
        NetworkManager.invalidateClient(serverUrl);
    });

    // Servers and plugins recognise the app and compare its version by the "Mattermost Mobile/<version>" user agent
    it('sends servers the Mattermost-compatible version in the user agent, not the Antimatter one', async () => {
        await NetworkManager.createClient(serverUrl);

        const calls = jest.mocked(getOrCreateAPIClient).mock.calls;
        const config = calls[calls.length - 1]?.[1];
        const userAgent = config?.headers?.[HEADER_USER_AGENT] ?? '';
        expect(userAgent.startsWith(`Mattermost Mobile/${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+821 (`)).toBe(true);
        expect(userAgent).not.toContain('0.9.0');
    });
});
