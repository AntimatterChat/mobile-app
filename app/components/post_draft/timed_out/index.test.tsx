// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import TimedOut from './index';

describe('TimedOut', () => {
    it('should say until when the user is timed out', () => {
        const until = new Date();
        until.setHours(23, 45, 0, 0);
        const {getByText} = renderWithIntlAndTheme(<TimedOut until={until.getTime()}/>);

        expect(getByText(/^You're timed out until 11:45\sPM: you can read, but not send messages or react\.$/)).toBeTruthy();
    });

    it('should say the day of a timeout ending another day', () => {
        const until = new Date(Date.now() + (3 * 24 * 3600 * 1000));
        const weekday = until.toLocaleDateString('en-US', {weekday: 'short'});
        const {getByText} = renderWithIntlAndTheme(<TimedOut until={until.getTime()}/>);

        expect(getByText(new RegExp(`^You're timed out until ${weekday} `))).toBeTruthy();
    });
});
