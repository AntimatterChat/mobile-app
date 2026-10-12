// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const serverUrl = 'https://server.example.com';

const entry = (postId: string, createAt: number): OnTopPost => ({
    post_id: postId,
    channel_id: 'channel1',
    created_by: 'user1',
    create_at: createAt,
    expires_at: 0,
});

describe('OnTopStore', () => {
    let OnTopStore: typeof import('./on_top_store').default;

    beforeEach(() => {
        jest.resetModules();
        OnTopStore = require('./on_top_store').default;
    });

    it('should ignore changes to channels not loaded', () => {
        OnTopStore.applyChange(serverUrl, 'channel1', {type: 'put', entry: entry('a', 1)});
        expect(OnTopStore.get(serverUrl, 'channel1')).toBeUndefined();
        expect(OnTopStore.loadedChannels(serverUrl)).toEqual([]);
    });

    it('should apply the changes received while a channel loads over its list', () => {
        OnTopStore.startLoading(serverUrl, 'channel1');
        OnTopStore.applyChange(serverUrl, 'channel1', {type: 'put', entry: entry('b', 2)});
        OnTopStore.applyChange(serverUrl, 'channel1', {type: 'removed', channelId: 'channel1', postId: 'a'});
        OnTopStore.loaded(serverUrl, 'channel1', [entry('a', 1)]);

        expect(OnTopStore.get(serverUrl, 'channel1')?.map((o) => o.post_id)).toEqual(['b']);
        expect(OnTopStore.loadedChannels(serverUrl)).toEqual(['channel1']);
    });

    it('should keep a loaded list up to date', () => {
        const listener = jest.fn();
        OnTopStore.loaded(serverUrl, 'channel1', []);
        OnTopStore.observe(serverUrl, 'channel1').subscribe(listener);
        OnTopStore.applyChange(serverUrl, 'channel1', {type: 'put', entry: entry('a', 1)});

        expect(listener).toHaveBeenLastCalledWith([entry('a', 1)]);
    });
});
