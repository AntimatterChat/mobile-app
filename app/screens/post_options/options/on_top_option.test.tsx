// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent} from '@testing-library/react-native';
import React from 'react';

import {fetchOnTopPosts, putPostOnTop, removePostFromTop} from '@actions/remote/on_top';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';
import OnTopStore from '@store/on_top_store';
import {renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';
import {showSnackBar} from '@utils/snack_bar';

import OnTopOption from './on_top_option';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/on_top');
jest.mock('@screens/navigation', () => ({
    bottomSheet: jest.fn(),
    dismissBottomSheet: jest.fn(),
}));
jest.mock('@utils/snack_bar');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

describe('OnTopOption', () => {
    let database: Database;

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(SERVER_URL);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function openDurations(post: ReturnType<typeof TestHelper.fakePostModel>) {
        const {getByText} = renderWithEverything(<OnTopOption post={post}/>, {database});
        return getByText;
    }

    it('should put a message on top for the duration chosen', async () => {
        const channel = TestHelper.basicChannel!;
        const post = TestHelper.fakePostModel({id: 'post1', channelId: channel.id});
        jest.mocked(putPostOnTop).mockResolvedValue({entry: {post_id: 'post1', channel_id: channel.id, created_by: 'me', create_at: 1, expires_at: 0}});
        const getByText = openDurations(post);

        expect(fetchOnTopPosts).toHaveBeenCalledWith(SERVER_URL, channel.id);
        await act(async () => {
            fireEvent.press(getByText('Put on top'));
        });
        expect(dismissBottomSheet).toHaveBeenCalled();

        const renderContent = jest.mocked(bottomSheet).mock.calls[0][0];
        const sheet = renderWithEverything(<>{renderContent()}</>, {database});
        expect(sheet.getByText('Keep on top of the channel')).toBeTruthy();
        expect(sheet.queryByText('Remove from top')).toBeNull();

        await act(async () => {
            fireEvent.press(sheet.getByText('For 4 hours'));
        });
        expect(putPostOnTop).toHaveBeenCalledWith(SERVER_URL, 'post1', 4 * 3600000);
        expect(showSnackBar).toHaveBeenCalledWith(expect.objectContaining({customMessage: `On top of #${channel.display_name} for 4 hours`, type: 'success'}));
    });

    it('should offer to change the time of a message on top or take it off', async () => {
        const post = TestHelper.fakePostModel({id: 'post2', channelId: 'channel2'});
        OnTopStore.loaded(SERVER_URL, 'channel2', [{post_id: 'post2', channel_id: 'channel2', created_by: 'me', create_at: 1, expires_at: 0}]);
        jest.mocked(removePostFromTop).mockResolvedValue({error: new Error('You do not have the appropriate permissions.')});
        const getByText = openDurations(post);

        expect(fetchOnTopPosts).not.toHaveBeenCalled();
        await act(async () => {
            fireEvent.press(getByText('On top · change'));
        });
        const renderContent = jest.mocked(bottomSheet).mock.calls[0][0];
        const sheet = renderWithEverything(<>{renderContent()}</>, {database});

        await act(async () => {
            fireEvent.press(sheet.getByText('Remove from top'));
        });
        expect(removePostFromTop).toHaveBeenCalledWith(SERVER_URL, 'channel2', 'post2');
        expect(showSnackBar).toHaveBeenCalledWith(expect.objectContaining({customMessage: 'You do not have the appropriate permissions.', type: 'error'}));
    });
});
