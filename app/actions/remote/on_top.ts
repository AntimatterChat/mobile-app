// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {forceLogoutIfNecessary} from '@actions/remote/session';
import NetworkManager from '@managers/network_manager';
import OnTopStore from '@store/on_top_store';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

// Antimatter: messages put on top of a channel.

// fetchOnTopPosts loads the messages on top of a channel.
export async function fetchOnTopPosts(serverUrl: string, channelId: string) {
    OnTopStore.startLoading(serverUrl, channelId);
    try {
        const client = NetworkManager.getClient(serverUrl);
        const list = await client.getOnTopPosts(channelId);
        OnTopStore.loaded(serverUrl, channelId, list || []);
        return {list};
    } catch (error) {
        OnTopStore.loadFailed(serverUrl, channelId);
        logDebug('error on fetchOnTopPosts', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// refreshOnTopPosts loads again the messages on top of the channels loaded, e.g. after a
// reconnection.
export async function refreshOnTopPosts(serverUrl: string) {
    await Promise.all(OnTopStore.loadedChannels(serverUrl).map((channelId) => fetchOnTopPosts(serverUrl, channelId)));
}

// putPostOnTop puts a message on top of its channel for a duration in milliseconds, or until removed (0).
export async function putPostOnTop(serverUrl: string, postId: string, duration: number) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const entry = await client.putPostOnTop(postId, duration);
        OnTopStore.applyChange(serverUrl, entry.channel_id, {type: 'put', entry});
        return {entry};
    } catch (error) {
        logDebug('error on putPostOnTop', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// removePostFromTop takes a message off the top of its channel.
export async function removePostFromTop(serverUrl: string, channelId: string, postId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        await client.removePostFromTop(postId);
        OnTopStore.applyChange(serverUrl, channelId, {type: 'removed', channelId, postId});
        return {data: true};
    } catch (error) {
        logDebug('error on removePostFromTop', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
