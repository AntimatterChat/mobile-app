// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {WebsocketEvents} from '@constants';
import DatabaseManager from '@database/manager';
import {getCurrentUserId} from '@queries/servers/system';
import {logDebug} from '@utils/log';

import {AM_PLUGIN_WEBSOCKET_EVENTS} from '../../constants';
import {amPluginsStore} from '../../store';
import {myVotesFromVoters} from '../../utils/polls';
import {refreshEnabledPlugins} from '../remote/plugins';
import {reloadPolls} from '../remote/polls';

import type {Poll} from '../../types';

// handlePollUpdated keeps the polls seen up to date. What the channel gets doesn't say what the
// user voted for: it's read from the voters, or kept for anonymous polls.
export async function handlePollUpdated(serverUrl: string, msg: WebSocketMessage<{poll: string}>) {
    let poll: Poll;
    try {
        poll = JSON.parse(msg.data.poll);
    } catch {
        logDebug('handlePollUpdated', 'received an invalid poll');
        return;
    }
    const known = amPluginsStore.getPoll(serverUrl, poll.id);
    if (!known) {
        return;
    }
    let myVotes = known.my_votes;
    if (!poll.anonymous) {
        const database = DatabaseManager.serverDatabases[serverUrl]?.database;
        if (database) {
            myVotes = myVotesFromVoters(poll, await getCurrentUserId(database));
        }
    }
    amPluginsStore.setPoll(serverUrl, {...poll, my_votes: myVotes});
}

// handlePollMyVotes applies the user's votes from another session.
export function handlePollMyVotes(serverUrl: string, msg: WebSocketMessage<{poll_id: string; my_votes: string}>) {
    try {
        const myVotes = JSON.parse(msg.data.my_votes);
        if (Array.isArray(myVotes)) {
            amPluginsStore.setMyVotes(serverUrl, msg.data.poll_id, myVotes);
        }
    } catch {
        logDebug('handlePollMyVotes', 'received invalid votes');
    }
}

export function handleAmPluginsEvents(serverUrl: string, msg: WebSocketMessage) {
    switch (msg.event) {
        case AM_PLUGIN_WEBSOCKET_EVENTS.POLL_UPDATED:
            handlePollUpdated(serverUrl, msg);
            break;
        case AM_PLUGIN_WEBSOCKET_EVENTS.POLL_MY_VOTES:
            handlePollMyVotes(serverUrl, msg);
            break;
        case WebsocketEvents.PLUGIN_ENABLED:
        case WebsocketEvents.PLUGIN_DISABLED:
        case WebsocketEvents.PLUGIN_STATUSES_CHANGED:
            refreshEnabledPlugins(serverUrl);
            break;
    }
}

// handleAmPluginsReconnect fetches again what may have changed while the socket was down.
export async function handleAmPluginsReconnect(serverUrl: string) {
    await Promise.all([
        refreshEnabledPlugins(serverUrl),
        reloadPolls(serverUrl),
    ]);
}
