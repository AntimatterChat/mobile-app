// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import OnTopStore from '@store/on_top_store';

import {fetchOnTopPosts, putPostOnTop, refreshOnTopPosts, removePostFromTop} from './on_top';

jest.mock('@managers/network_manager');
jest.mock('@actions/remote/session');
jest.mock('@utils/log');

const serverUrl = 'https://server.example.com';

const entry = (postId: string, createAt: number, channelId = 'channel1'): OnTopPost => ({
    post_id: postId,
    channel_id: channelId,
    created_by: 'user1',
    create_at: createAt,
    expires_at: 0,
});

describe('on top actions', () => {
    const client = {
        getOnTopPosts: jest.fn(),
        putPostOnTop: jest.fn(),
        removePostFromTop: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as any);
    });

    it('should load a channel\'s messages on top into the store', async () => {
        client.getOnTopPosts.mockResolvedValue([entry('a', 1)]);
        const result = await fetchOnTopPosts(serverUrl, 'channel1');

        expect(client.getOnTopPosts).toHaveBeenCalledWith('channel1');
        expect(result.list).toEqual([entry('a', 1)]);
        expect(OnTopStore.get(serverUrl, 'channel1')).toEqual([entry('a', 1)]);
    });

    it('should return the error when the list fails to load', async () => {
        const error = new Error('nope');
        client.getOnTopPosts.mockRejectedValue(error);
        const result = await fetchOnTopPosts(serverUrl, 'channel2');

        expect(result.error).toBe(error);
        expect(OnTopStore.get(serverUrl, 'channel2')).toBeUndefined();
    });

    it('should put a message on top and show it first', async () => {
        OnTopStore.loaded(serverUrl, 'channel3', [entry('a', 1, 'channel3')]);
        client.putPostOnTop.mockResolvedValue(entry('b', 2, 'channel3'));
        const result = await putPostOnTop(serverUrl, 'b', 3600000);

        expect(client.putPostOnTop).toHaveBeenCalledWith('b', 3600000);
        expect(result.entry).toEqual(entry('b', 2, 'channel3'));
        expect(OnTopStore.get(serverUrl, 'channel3')?.map((o) => o.post_id)).toEqual(['b', 'a']);
    });

    it('should take a message off the top', async () => {
        OnTopStore.loaded(serverUrl, 'channel4', [entry('a', 1, 'channel4')]);
        client.removePostFromTop.mockResolvedValue({status: 'OK'});
        const result = await removePostFromTop(serverUrl, 'channel4', 'a');

        expect(client.removePostFromTop).toHaveBeenCalledWith('a');
        expect(result.data).toBe(true);
        expect(OnTopStore.get(serverUrl, 'channel4')).toEqual([]);
    });

    it('should keep the list when the server refuses to take a message off the top', async () => {
        OnTopStore.loaded(serverUrl, 'channel5', [entry('a', 1, 'channel5')]);
        client.removePostFromTop.mockRejectedValue(new Error('forbidden'));
        const result = await removePostFromTop(serverUrl, 'channel5', 'a');

        expect(result.error).toBeDefined();
        expect(OnTopStore.get(serverUrl, 'channel5')).toHaveLength(1);
    });

    it('should load again the lists of the channels loaded', async () => {
        client.getOnTopPosts.mockResolvedValue([]);
        await refreshOnTopPosts(serverUrl);

        const channels = client.getOnTopPosts.mock.calls.map(([id]) => id).sort();
        expect(channels).toEqual(['channel1', 'channel3', 'channel4', 'channel5']);
    });
});
