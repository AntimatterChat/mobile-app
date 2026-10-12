// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {cleanPollOptions, endsIn, isPollEnded, myVotesFromVoters, percent, pollVoters} from './polls';

import type {Poll} from '../types';

const poll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 'poll1',
    post_id: 'post1',
    channel_id: 'channel1',
    creator_id: 'user1',
    question: 'Lunch?',
    options: [
        {text: 'Pizza', votes: 2, voters: ['user1', 'user2']},
        {text: 'Sushi', votes: 1, voters: ['user2']},
        {text: 'Salad', votes: 0, voters: []},
    ],
    multi: true,
    anonymous: false,
    create_at: 0,
    closed: false,
    voter_count: 3,
    my_votes: [],
    ...overrides,
});

describe('polls utils', () => {
    it('should round the share of voters like the server', () => {
        const p = poll();
        expect(percent(p, 0)).toBe(67);
        expect(percent(p, 1)).toBe(33);
        expect(percent(p, 2)).toBe(0);
        expect(percent(poll({voter_count: 0}), 0)).toBe(0);
    });

    it('should read the user\'s votes from the voters', () => {
        expect(myVotesFromVoters(poll(), 'user2')).toEqual([0, 1]);
        expect(myVotesFromVoters(poll(), 'user3')).toEqual([]);
    });

    it('should list each voter once', () => {
        expect(pollVoters(poll()).sort()).toEqual(['user1', 'user2']);
    });

    it('should tell the time left in the largest unit that fits', () => {
        const now = 1_000_000;
        expect(endsIn(poll(), now)).toBeNull();
        expect(endsIn(poll({end_at: now + (5 * 60000)}), now)).toEqual({value: 5, unit: 'minute'});
        expect(endsIn(poll({end_at: now + (3 * 3600000)}), now)).toEqual({value: 3, unit: 'hour'});
        expect(endsIn(poll({end_at: now + (3 * 24 * 3600000)}), now)).toEqual({value: 3, unit: 'day'});
        expect(endsIn(poll({end_at: now + 60000, closed: true}), now)).toBeNull();
    });

    it('should end polls closed or past their end', () => {
        const now = 1_000_000;
        expect(isPollEnded(poll(), now)).toBe(false);
        expect(isPollEnded(poll({closed: true}), now)).toBe(true);
        expect(isPollEnded(poll({end_at: now - 1}), now)).toBe(true);
        expect(isPollEnded(poll({end_at: now + 1}), now)).toBe(false);
    });

    it('should trim the answers and leave out the empty ones', () => {
        expect(cleanPollOptions([' Yes ', '', '  ', 'No'])).toEqual(['Yes', 'No']);
    });
});
