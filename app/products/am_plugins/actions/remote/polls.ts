// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {forceLogoutIfNecessary} from '@actions/remote/session';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {amPluginsStore} from '../../store';

import type {Poll, PollRequest} from '../../types';

const loading = new Map<string, Promise<{poll?: Poll; error?: unknown}>>();

// fetchPoll loads a poll into the store, one request at a time per poll.
export function fetchPoll(serverUrl: string, pollId: string) {
    const key = `${serverUrl}|${pollId}`;
    let request = loading.get(key);
    if (!request) {
        request = (async () => {
            try {
                const client = NetworkManager.getClient(serverUrl);
                const poll = await client.getPoll(pollId);
                amPluginsStore.setPoll(serverUrl, poll);
                return {poll};
            } catch (error) {
                logDebug('error on fetchPoll', getFullErrorMessage(error));
                forceLogoutIfNecessary(serverUrl, error);
                return {error};
            } finally {
                loading.delete(key);
            }
        })();
        loading.set(key, request);
    }
    return request;
}

// reloadPolls fetches again the polls seen on a server, e.g. after a reconnection.
export async function reloadPolls(serverUrl: string) {
    await Promise.all(amPluginsStore.getPollIds(serverUrl).map((id) => fetchPoll(serverUrl, id)));
}

// togglePollVote votes for an answer, or takes the vote back when the user already voted for it.
export async function togglePollVote(serverUrl: string, poll: Poll, option: number) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const remove = poll.my_votes.includes(option);
        const updated = remove ? await client.unvotePoll(poll.id, option) : await client.votePoll(poll.id, option);
        amPluginsStore.setPoll(serverUrl, updated);
        return {poll: updated};
    } catch (error) {
        logDebug('error on togglePollVote', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

export async function closePoll(serverUrl: string, pollId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const poll = await client.closePoll(pollId);
        amPluginsStore.setPoll(serverUrl, poll);
        return {poll};
    } catch (error) {
        logDebug('error on closePoll', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// createPoll creates a poll: the plugin posts it in the channel (or thread).
export async function createPoll(serverUrl: string, request: PollRequest) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const poll = await client.createPoll(request);
        amPluginsStore.setPoll(serverUrl, poll);
        return {poll};
    } catch (error) {
        logDebug('error on createPoll', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
