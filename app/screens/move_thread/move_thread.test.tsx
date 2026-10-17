// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Alert} from 'react-native';

import {switchToChannelById} from '@actions/remote/channel';
import {moveThread} from '@actions/remote/move_thread';
import {fetchPostThread} from '@actions/remote/post';
import {General} from '@constants';
import {navigateBack} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import MoveThread from './move_thread';

import type ChannelModel from '@typings/database/models/servers/channel';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('@actions/remote/channel', () => ({switchToChannelById: jest.fn()}));
jest.mock('@actions/remote/move_thread', () => ({moveThread: jest.fn()}));
jest.mock('@actions/remote/post', () => ({fetchPostThread: jest.fn()}));
jest.mock('@screens/navigation', () => ({navigateBack: jest.fn(() => Promise.resolve())}));
jest.mock('@hooks/android_back_handler', () => jest.fn());
jest.mock('@context/server', () => ({useServerUrl: jest.fn(() => 'some.server.url')}));
jest.mock('@components/channel_item', () => {
    const {Text} = require('react-native');
    return {
        __esModule: true,
        default: ({channel, onPress, testID}: any) => (
            <Text
                testID={testID}
                onPress={() => onPress(channel)}
            >
                {channel.displayName}
            </Text>
        ),
    };
});

describe('MoveThread', () => {
    const me = TestHelper.fakeUserModel({id: 'me'});
    const town = TestHelper.fakeChannelModel({id: 'town', name: 'town', displayName: 'Town', teamId: 'team1', type: General.OPEN_CHANNEL, deleteAt: 0});
    const ops = TestHelper.fakeChannelModel({id: 'ops', name: 'ops', displayName: 'Ops', teamId: 'team1', type: General.OPEN_CHANNEL, deleteAt: 0});
    const board = TestHelper.fakeChannelModel({id: 'board', name: 'board', displayName: 'Board', teamId: 'team1', type: General.PRIVATE_CHANNEL, deleteAt: 0});
    const news = TestHelper.fakeChannelModel({id: 'news', name: 'news', displayName: 'News', teamId: 'team1', type: General.OPEN_CHANNEL, deleteAt: 0});
    const targets = [
        {channel: town, isMember: true, canPost: true},
        {channel: ops, isMember: true, canPost: true},
        {channel: board, isMember: true, canPost: true},
        {channel: news, isMember: true, canPost: false},
    ];
    const root = TestHelper.fakePostModel({id: 'root', userId: 'me', channelId: 'town', rootId: '', type: ''});

    const renderScreen = (props: Partial<React.ComponentProps<typeof MoveThread>> = {}) => renderWithIntlAndTheme(
        <MoveThread
            rootId='root'
            channelId='town'
            root={root}
            source={town as ChannelModel}
            currentUser={me}
            isModerator={false}
            targets={targets}
            {...props}
        />,
    );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should list public channels only to an author moving others\' replies, and say why', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'me'}, {user_id: 'them'}]} as any);
        const {findByTestId, queryByTestId} = renderScreen();

        expect(await findByTestId('move_thread.public_only')).toBeTruthy();
        expect(fetchPostThread).toHaveBeenCalledWith('some.server.url', 'root', {fetchAll: true}, true);
        expect(queryByTestId('move_thread.channel.ops')).toBeTruthy();
        expect(queryByTestId('move_thread.channel.board')).toBeNull();
        expect(queryByTestId('move_thread.channel.news')).toBeNull();
        expect(queryByTestId('move_thread.channel.town')).toBeNull();
    });

    it('should list private channels too when the whole thread is the author\'s', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'me'}, {user_id: 'me'}]} as any);
        const {findByTestId, queryByTestId} = renderScreen();

        expect(await findByTestId('move_thread.channel.board')).toBeTruthy();
        expect(queryByTestId('move_thread.channel.ops')).toBeTruthy();
        expect(queryByTestId('move_thread.public_only')).toBeNull();
    });

    it('should say only a moderator moves others\' replies out of a private channel', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'me'}, {user_id: 'them'}]} as any);
        const {findByText} = renderScreen({source: board as ChannelModel});

        expect(await findByText('Others replied in this thread: only a moderator can move it out of a private channel.')).toBeTruthy();
    });

    it('should list every channel one may post in to a moderator', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'them'}]} as any);
        const {findByTestId, queryByTestId} = renderScreen({isModerator: true, root: TestHelper.fakePostModel({id: 'root', userId: 'them', channelId: 'town', rootId: '', type: ''})});

        expect(await findByTestId('move_thread.channel.board')).toBeTruthy();
        expect(queryByTestId('move_thread.channel.ops')).toBeTruthy();
        expect(queryByTestId('move_thread.channel.news')).toBeNull();
    });

    it('should move the thread once confirmed, flattened when asked, and go to its channel', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'me'}]} as any);
        jest.mocked(moveThread).mockResolvedValue({post: TestHelper.fakePost({id: 'new-root'})});
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const {findByTestId, getByTestId} = renderScreen();

        fireEvent(getByTestId('move_thread.flatten.toggle.toggled.false.button'), 'valueChange', true);
        fireEvent.press(await findByTestId('move_thread.channel.ops'));
        expect(alert).toHaveBeenCalledWith('Move the thread?', 'Its messages will move to #Ops, its replies as separate messages. A link to them stays here.', expect.any(Array));

        const buttons = alert.mock.lastCall![2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });
        await waitFor(() => expect(moveThread).toHaveBeenCalledWith('some.server.url', 'root', 'ops', true));
        expect(navigateBack).toHaveBeenCalled();
        expect(switchToChannelById).toHaveBeenCalledWith('some.server.url', 'ops');
    });

    it('should show the server\'s error', async () => {
        jest.mocked(fetchPostThread).mockResolvedValue({posts: [{user_id: 'me'}]} as any);
        jest.mocked(moveThread).mockResolvedValue({error: {message: 'Only a moderator can move this thread.'}});
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const {findByTestId} = renderScreen();

        fireEvent.press(await findByTestId('move_thread.channel.ops'));
        const buttons = alert.mock.lastCall![2]!;
        await act(async () => {
            await buttons[1].onPress!();
        });
        await waitFor(() => expect(alert).toHaveBeenLastCalledWith('The thread couldn\'t be moved', 'Only a moderator can move this thread.'));
        expect(navigateBack).not.toHaveBeenCalled();
    });
});
