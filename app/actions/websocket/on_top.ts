// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import OnTopStore from '@store/on_top_store';
import {logDebug} from '@utils/log';

// Antimatter: a message was put on top of its channel (or again, with a new time).
export function handlePostPutOnTop(serverUrl: string, msg: WebSocketMessage<{on_top?: OnTopPost | string}>) {
    let entry = msg.data.on_top;
    if (typeof entry === 'string') {
        try {
            entry = JSON.parse(entry) as OnTopPost;
        } catch {
            entry = undefined;
        }
    }
    if (!entry?.post_id || !entry.channel_id) {
        logDebug('handlePostPutOnTop', 'received an invalid entry');
        return;
    }
    OnTopStore.applyChange(serverUrl, entry.channel_id, {type: 'put', entry});
}

// Antimatter: a message was taken off the top of its channel.
export function handlePostRemovedFromTop(serverUrl: string, msg: WebSocketMessage<{post_id?: string; channel_id?: string}>) {
    const channelId = msg.data.channel_id || msg.broadcast?.channel_id;
    const postId = msg.data.post_id;
    if (!channelId || !postId) {
        logDebug('handlePostRemovedFromTop', 'received an invalid event');
        return;
    }
    OnTopStore.applyChange(serverUrl, channelId, {type: 'removed', channelId, postId});
}
