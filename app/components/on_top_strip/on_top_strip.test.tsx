// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {fetchOnTopPosts, removePostFromTop} from '@actions/remote/on_top';
import {showPermalink} from '@actions/remote/permalink';
import {fetchPostById} from '@actions/remote/post';
import {renderWithEverything} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import OnTopStrip from './on_top_strip';

import type {Database} from '@nozbe/watermelondb';

jest.mock('@actions/remote/on_top');
jest.mock('@actions/remote/permalink');
jest.mock('@actions/remote/post');
jest.mock('@actions/remote/user');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

describe('OnTopStrip', () => {
    let database: Database;
    let postId: string;
    let channelId: string;
    let currentUserId: string;

    const entry = (id: string, createdBy: string, expiresAt = 0): OnTopPost => ({
        post_id: id,
        channel_id: channelId,
        created_by: createdBy,
        create_at: Date.now(),
        expires_at: expiresAt,
    });

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(SERVER_URL);
        database = server.database;
        postId = TestHelper.basicPost!.id;
        channelId = TestHelper.basicChannel!.id;
        currentUserId = TestHelper.basicUser!.id;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(removePostFromTop).mockResolvedValue({data: true});
        jest.mocked(fetchPostById).mockResolvedValue({error: new Error('not found')});
    });

    it('should load what is on top of the channel and show nothing when it is empty', () => {
        const {queryByTestId} = renderWithEverything(
            <OnTopStrip
                channelId={channelId}
                list={[]}
                canRemove={true}
                currentUserId={currentUserId}
                isTopItem={true}
            />,
            {database},
        );

        expect(fetchOnTopPosts).toHaveBeenCalledWith(SERVER_URL, channelId);
        expect(queryByTestId('channel.on_top_strip')).toBeNull();
    });

    it('should show the message on top, who put it there and for how long', async () => {
        const {findByTestId, getByText, queryByTestId} = renderWithEverything(
            <OnTopStrip
                channelId={channelId}
                list={[entry(postId, currentUserId, Date.now() + (200 * 60000) + 10000)]}
                canRemove={false}
                currentUserId={currentUserId}
                isTopItem={true}
            />,
            {database},
        );

        expect(await findByTestId('channel.on_top_strip')).toBeTruthy();
        expect(getByText('· put on top by you', {exact: false})).toBeTruthy();
        expect(getByText('3h 20m left')).toBeTruthy();
        expect(queryByTestId('channel.on_top_strip.remove')).toBeNull();
        expect(queryByTestId('channel.on_top_strip.next')).toBeNull();

        fireEvent.press(getByText('Jump'));
        expect(showPermalink).toHaveBeenCalledWith(SERVER_URL, '', postId);
    });

    it('should leave out the messages that can\'t be loaded and navigate between the others', async () => {
        const fetched = TestHelper.fakePost({id: 'remote', channel_id: channelId, message: 'From the server'});
        jest.mocked(fetchPostById).mockImplementation(async (_url, id) => (id === 'remote' ? {post: fetched} : {error: new Error('not found')}));

        const {findByText, getByTestId, getByText, queryByText} = renderWithEverything(
            <OnTopStrip
                channelId={channelId}
                list={[entry('remote', 'other'), entry('gone', 'other'), entry(postId, 'other')]}
                canRemove={true}
                currentUserId={currentUserId}
                isTopItem={false}
            />,
            {database},
        );

        expect(await findByText('From the server')).toBeTruthy();
        await waitFor(() => expect(getByText('1/2')).toBeTruthy());
        expect(fetchPostById).toHaveBeenCalledWith(SERVER_URL, 'remote', true);

        fireEvent.press(getByTestId('channel.on_top_strip.next'));
        expect(getByText('2/2')).toBeTruthy();
        expect(queryByText('From the server')).toBeNull();

        await act(async () => {
            fireEvent.press(getByTestId('channel.on_top_strip.remove'));
        });
        expect(removePostFromTop).toHaveBeenCalledWith(SERVER_URL, channelId, postId);
    });
});
