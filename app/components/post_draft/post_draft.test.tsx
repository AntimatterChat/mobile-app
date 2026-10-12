// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fetchMyTeamTimeout} from '@actions/remote/member_timeout';
import {Screens} from '@constants';
import MemberTimeoutStore from '@store/member_timeout_store';
import {act, renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import PostDraft from './post_draft';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/member_timeout', () => ({fetchMyTeamTimeout: jest.fn()}));
jest.mock('./draft_handler', () => {
    const {Text} = require('react-native');
    const MockDraftHandler = () => <Text testID='draft_handler'/>;
    return MockDraftHandler;
});
jest.mock('@components/autocomplete', () => () => null);

describe('PostDraft timeouts', () => {
    const serverUrl = 'postdraft.test.com';
    let database: Database;

    const props = {
        testID: 'post_draft',
        canPost: true,
        channelId: 'c1',
        channelIsReadOnly: false,
        deactivatedChannel: false,
        containerHeight: 600,
        isChannelScreen: true,
        location: Screens.CHANNEL,
        teamId: 't1',
    };

    beforeAll(async () => {
        database = (await TestHelper.setupServerDatabase(serverUrl)).database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.useFakeTimers({doNotFake: ['nextTick']});
        MemberTimeoutStore.clear();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should load the team\'s timeout and show the composer while not timed out', () => {
        const {getByTestId, queryByTestId} = renderWithEverything(<PostDraft {...props}/>, {database, serverUrl});

        expect(fetchMyTeamTimeout).toHaveBeenCalledWith(serverUrl, 't1');
        expect(getByTestId('draft_handler')).toBeTruthy();
        expect(queryByTestId('post_draft.timed_out')).toBeNull();
    });

    it('should take the composer away until the timeout ends', () => {
        MemberTimeoutStore.setUntil(serverUrl, 't1', Date.now() + 60000);
        const {getByTestId, queryByTestId} = renderWithEverything(<PostDraft {...props}/>, {database, serverUrl});

        expect(fetchMyTeamTimeout).not.toHaveBeenCalled();
        expect(getByTestId('post_draft.timed_out')).toBeTruthy();
        expect(queryByTestId('draft_handler')).toBeNull();

        act(() => {
            jest.advanceTimersByTime(61000);
        });
        expect(queryByTestId('post_draft.timed_out')).toBeNull();
        expect(getByTestId('draft_handler')).toBeTruthy();
    });

    it('should not apply to conversations outside teams', () => {
        MemberTimeoutStore.setUntil(serverUrl, 't1', Date.now() + 60000);
        const {getByTestId} = renderWithEverything(
            <PostDraft
                {...props}
                teamId={undefined}
            />,
            {database, serverUrl},
        );

        expect(getByTestId('draft_handler')).toBeTruthy();
    });
});
