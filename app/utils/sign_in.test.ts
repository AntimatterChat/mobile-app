// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getIntlShape} from '@utils/general';

import {describeDevice} from './sign_in';

describe('describeDevice', () => {
    const intl = getIntlShape();
    const baseSignIn: SignIn = {
        session_id: 'session-1',
        create_at: Date.now(),
        platform: 'Linux',
        os: 'Linux',
        browser: 'Firefox/120.0',
        mobile: false,
    };

    it('names the browser and the operating system', () => {
        expect(describeDevice(intl, baseSignIn)).toBe('Firefox on Linux');
    });

    it('names the mobile app', () => {
        expect(describeDevice(intl, {...baseSignIn, mobile: true, browser: '', os: 'Android'})).toBe('Mobile app on Android');
    });

    it('names the desktop app', () => {
        expect(describeDevice(intl, {...baseSignIn, browser: 'Desktop App/5.0', os: 'macOS'})).toBe('Desktop app on macOS');
    });

    it('falls back to an unknown device when nothing is known', () => {
        expect(describeDevice(intl, {...baseSignIn, browser: 'Unknown', os: '', platform: 'Unknown'})).toBe('Unknown device');
    });

    it('shows just the browser when the system is unknown', () => {
        expect(describeDevice(intl, {...baseSignIn, os: '', platform: 'Unknown'})).toBe('Firefox');
    });
});
