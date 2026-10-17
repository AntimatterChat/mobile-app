// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import semver from 'semver';

import {COMPATIBLE_MATTERMOST_MOBILE_VERSION} from '@constants/versions';

import {getServerClientVersion, getServerMobileVersion, getServerUserAgent} from './client_version';

const mockExpoApplication = {
    nativeApplicationVersion: '0.9.0',
    nativeBuildVersion: '821' as string | null,
};

jest.mock('expo-application', () => ({
    get nativeApplicationVersion() {
        return mockExpoApplication.nativeApplicationVersion;
    },
    get nativeBuildVersion() {
        return mockExpoApplication.nativeBuildVersion;
    },
}));

jest.mock('expo-device', () => ({
    osName: 'Android',
    osVersion: '15',
    modelName: 'Pixel 9',
}));

// The server's getBrowserVersion (channels/app/user_agent.go): the first field after "Mattermost Mobile/"
const serverMobileVersion = (userAgent: string) => userAgent.split('Mattermost Mobile/')[1]?.split(/\s+/)[0];

describe('utils/client_version', () => {
    beforeEach(() => {
        mockExpoApplication.nativeApplicationVersion = '0.9.0';
        mockExpoApplication.nativeBuildVersion = '821';
    });

    it('is a plain release version, never lower than the version the fork was renumbered from', () => {
        expect(semver.valid(COMPATIBLE_MATTERMOST_MOBILE_VERSION)).toBe(COMPATIBLE_MATTERMOST_MOBILE_VERSION);
        expect(semver.prerelease(COMPATIBLE_MATTERMOST_MOBILE_VERSION)).toBeNull();
        expect(semver.gte(COMPATIBLE_MATTERMOST_MOBILE_VERSION, '2.45.0')).toBe(true);
    });

    describe('getServerUserAgent', () => {
        it('reports the Mattermost-compatible version, not Antimatter\'s 0.9.0', () => {
            const userAgent = getServerUserAgent();
            expect(userAgent).toBe(`Mattermost Mobile/${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+821 (Android; 15; Pixel 9)`);
            expect(userAgent).not.toContain('0.9.0');
        });

        it('keeps the compatible version for a prerelease Antimatter build', () => {
            mockExpoApplication.nativeApplicationVersion = '0.9.0-rc-1';
            expect(getServerUserAgent()).toContain(`Mattermost Mobile/${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+821 `);
        });

        it('passes a ">= 2.0.0" server check with app version 0.9.0', () => {
            const version = serverMobileVersion(getServerUserAgent());
            expect(semver.valid(version)).toBeTruthy();
            expect(semver.gte(version ?? '', '2.0.0')).toBe(true);

            // The real version would fail it
            expect(semver.gte('0.9.0', '2.0.0')).toBe(false);
        });
    });

    describe('getServerMobileVersion', () => {
        // The server accepts the mobile_version session prop only as a strict semantic version
        it('is the compatible version, a strict semantic version', () => {
            expect(getServerMobileVersion()).toBe(COMPATIBLE_MATTERMOST_MOBILE_VERSION);
            expect(semver.valid(getServerMobileVersion())).toBe(getServerMobileVersion());
        });
    });

    describe('getServerClientVersion', () => {
        it('is the compatible version with the build number', () => {
            expect(getServerClientVersion()).toBe(`${COMPATIBLE_MATTERMOST_MOBILE_VERSION}+821`);
            expect(semver.gte(getServerClientVersion(), '2.0.0')).toBe(true);
        });

        it('is the compatible version alone without a build number', () => {
            mockExpoApplication.nativeBuildVersion = null;
            expect(getServerClientVersion()).toBe(COMPATIBLE_MATTERMOST_MOBILE_VERSION);
        });
    });
});
