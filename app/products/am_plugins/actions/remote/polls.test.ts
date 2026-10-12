// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';

import {amPluginsStore} from '../../store';

import {closePoll, createPoll, fetchPoll, reloadPolls, togglePollVote} from './polls';

import type {Poll} from '../../types';

jest.mock('@managers/network_manager');
jest.mock('@actions/remote/session');
jest.mock('@utils/log');

const serverUrl = 'https://server.example.com';

const poll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 'poll1',
    post_id: 'post1',
    channel_id: 'channel1',
    creator_id: 'user1',
    question: 'Lunch?',
    options: [{text: 'Pizza', votes: 0}, {text: 'Sushi', votes: 0}],
    multi: false,
    anonymous: false,
    create_at: 0,
    closed: false,
    voter_count: 0,
    my_votes: [],
    ...overrides,
});

describe('polls actions', () => {
    const client = {
        getPoll: jest.fn(),
        votePoll: jest.fn(),
        unvotePoll: jest.fn(),
        closePoll: jest.fn(),
        createPoll: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        amPluginsStore.clear(serverUrl);
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as any);
    });

    it('should load a poll once while it loads', async () => {
        client.getPoll.mockResolvedValue(poll());
        const [a, b] = await Promise.all([fetchPoll(serverUrl, 'poll1'), fetchPoll(serverUrl, 'poll1')]);

        expect(client.getPoll).toHaveBeenCalledTimes(1);
        expect(a.poll).toEqual(poll());
        expect(b.poll).toEqual(poll());
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')).toEqual(poll());
    });

    it('should return the error of a poll that fails to load', async () => {
        client.getPoll.mockRejectedValue(new Error('not found'));
        const result = await fetchPoll(serverUrl, 'poll2');

        expect(result.error).toBeDefined();
        expect(amPluginsStore.getPoll(serverUrl, 'poll2')).toBeUndefined();
    });

    it('should vote for an answer, or take the vote back', async () => {
        client.votePoll.mockResolvedValue(poll({my_votes: [1], voter_count: 1}));
        await togglePollVote(serverUrl, poll(), 1);
        expect(client.votePoll).toHaveBeenCalledWith('poll1', 1);
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([1]);

        client.unvotePoll.mockResolvedValue(poll());
        await togglePollVote(serverUrl, poll({my_votes: [1]}), 1);
        expect(client.unvotePoll).toHaveBeenCalledWith('poll1', 1);
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.my_votes).toEqual([]);
    });

    it('should keep the poll when a vote fails', async () => {
        amPluginsStore.setPoll(serverUrl, poll());
        client.votePoll.mockRejectedValue(new Error('the poll is closed'));
        const result = await togglePollVote(serverUrl, poll(), 0);

        expect(result.error).toBeDefined();
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')).toEqual(poll());
    });

    it('should close a poll', async () => {
        client.closePoll.mockResolvedValue(poll({closed: true}));
        await closePoll(serverUrl, 'poll1');

        expect(client.closePoll).toHaveBeenCalledWith('poll1');
        expect(amPluginsStore.getPoll(serverUrl, 'poll1')?.closed).toBe(true);
    });

    it('should create a poll', async () => {
        client.createPoll.mockResolvedValue(poll());
        const request = {channel_id: 'channel1', question: 'Lunch?', options: ['Pizza', 'Sushi'], multi: false, anonymous: false, duration_minutes: 60};
        const result = await createPoll(serverUrl, request);

        expect(client.createPoll).toHaveBeenCalledWith(request);
        expect(result.poll).toEqual(poll());
    });

    it('should load again the polls seen', async () => {
        amPluginsStore.setPoll(serverUrl, poll());
        amPluginsStore.setPoll(serverUrl, poll({id: 'poll3'}));
        client.getPoll.mockImplementation((id: string) => Promise.resolve(poll({id, voter_count: 5})));
        await reloadPolls(serverUrl);

        expect(client.getPoll).toHaveBeenCalledTimes(2);
        expect(amPluginsStore.getPoll(serverUrl, 'poll3')?.voter_count).toBe(5);
    });
});
