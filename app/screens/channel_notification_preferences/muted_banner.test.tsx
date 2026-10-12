// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {unmuteChannel} from '@actions/remote/timed_mute';
import {fireEvent, renderWithEverything, waitFor} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import MutedBanner from './muted_banner';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/timed_mute', () => ({unmuteChannel: jest.fn()}));

describe('MutedBanner', () => {
    const serverUrl = 'mutedbanner.test.com';
    let database: Database;

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
        await server.operator.handlePreferences({
            preferences: [{user_id: 'me', category: 'fusion_mute_until', name: 'timed', value: String(Date.UTC(2026, 9, 16, 15, 0))}],
            prepareRecordsOnly: false,
        });
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('should say when a timed mute ends', async () => {
        const {findByTestId} = renderWithEverything(<MutedBanner channelId='timed'/>, {database, serverUrl});

        expect(await findByTestId('channel_notification_preferences.muted_until')).toHaveTextContent(/^Muted until Fri/);
    });

    it('should say a channel is muted, and unmute it', async () => {
        const {getByText} = renderWithEverything(<MutedBanner channelId='forever'/>, {database, serverUrl});

        expect(getByText('This channel is muted')).toBeTruthy();
        fireEvent.press(getByText('Unmute channel'));
        await waitFor(() => expect(unmuteChannel).toHaveBeenCalledWith(serverUrl, 'forever'));
    });
});
