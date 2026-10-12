// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import TestHelper from '@test/test_helper';

import {amPluginsStore} from '../../store';

import {handleAmPluginsEvents, handlePollMyVotes, handlePollUpdated} from './index';

import type {Poll} from '../../types';

jest.mock('../remote/plugins');

const serverUrl = 'https://server.example.com';

const poll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 'poll1',
    post_id: 'post1',
    channel_id: 'channel1',
    creator_id: 'user1',
    question: 'Lunch?',
    options: [{text: 'Pizza', votes: 0, voters: []}, {text: 'Sushi', votes: 0, voters: []}],
    multi: false,
    anonymous: false,
    create_at: 0,
    closed: false,
    voter_count: 0,
    my_votes: [],
    ...overrides,
});

const updated = (p: Poll) => ({event: 'custom_com.antimatterchat.polls_poll_updated', data: {poll: JSON.stringify(p)}, broadcast: {}} as WebSocketMessage);

describe('polls websocket events', () => {
    let currentUserId: string;

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        const {operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        currentUserId = TestHelper.generateId();
        await operator.handleSystem({systems: [{id: 'currentUserId', value: currentUserId}], prepareRecordsOnly: false});
        amPluginsStore.clear(serverUrl);
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
    });

    it('should ignore polls not seen', async () => {
        await handlePollUpdated(serverUrl, updated(poll()));
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')).toBeUndefined();
    });

    it('should read the user\'s votes from the voters', async () => {
        amPluginsStore.setPoll(serverUrl, poll({my_votes: [0]}));
        await handlePollUpdated(serverUrl, updated(poll({
            options: [{text: 'Pizza', votes: 0, voters: []}, {text: 'Sushi', votes: 1, voters: [currentUserId]}],
            voter_count: 1,
        })));

        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([1]);
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.voter_count).toBe(1);
    });

    it('should keep the user\'s votes of anonymous polls', async () => {
        amPluginsStore.setPoll(serverUrl, poll({anonymous: true, my_votes: [0]}));
        await handlePollUpdated(serverUrl, updated(poll({anonymous: true, voter_count: 3})));

        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([0]);
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.voter_count).toBe(3);
    });

    it('should apply the user\'s votes from another session', () => {
        amPluginsStore.setPoll(serverUrl, poll({anonymous: true}));
        handlePollMyVotes(serverUrl, {event: '', data: {poll_id: 'poll1', my_votes: '[1]'}, broadcast: {}} as WebSocketMessage);

        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([1]);
    });

    it('should dispatch the plugin events', () => {
        amPluginsStore.setPoll(serverUrl, poll({anonymous: true}));
        handleAmPluginsEvents(serverUrl, {event: 'custom_com.antimatterchat.polls_poll_my_votes', data: {poll_id: 'poll1', my_votes: '[0]'}, broadcast: {}} as WebSocketMessage);

        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([0]);
    });
});
