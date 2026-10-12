// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import OnTopStore from '@store/on_top_store';

import {handlePostPutOnTop, handlePostRemovedFromTop} from './on_top';

const serverUrl = 'https://server.example.com';

const entry: OnTopPost = {post_id: 'a', channel_id: 'channel1', created_by: 'user1', create_at: 1, expires_at: 0};

describe('on top websocket events', () => {
    beforeEach(() => {
        OnTopStore.loaded(serverUrl, 'channel1', []);
    });

    it('should add a message put on top', () => {
        handlePostPutOnTop(serverUrl, {event: 'post_put_on_top', data: {on_top: entry}, broadcast: {channel_id: 'channel1'}} as WebSocketMessage);
        expect(OnTopStore.get(serverUrl, 'channel1')).toEqual([entry]);

        handlePostRemovedFromTop(serverUrl, {event: 'post_removed_from_top', data: {post_id: 'a', channel_id: 'channel1'}, broadcast: {}} as WebSocketMessage);
        expect(OnTopStore.get(serverUrl, 'channel1')).toEqual([]);
    });

    it('should accept the entry encoded as JSON and ignore invalid ones', () => {
        handlePostPutOnTop(serverUrl, {event: 'post_put_on_top', data: {on_top: 'not json'}, broadcast: {}} as WebSocketMessage);
        expect(OnTopStore.get(serverUrl, 'channel1')).toEqual([]);

        handlePostPutOnTop(serverUrl, {event: 'post_put_on_top', data: {on_top: JSON.stringify(entry)}, broadcast: {}} as WebSocketMessage);
        expect(OnTopStore.get(serverUrl, 'channel1')).toEqual([entry]);
    });
});
