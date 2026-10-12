// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Poll} from '../types';

// percent returns the share of the voters who voted for an answer, rounded like the server does.
export function percent(poll: Poll, option: number): number {
    const votes = poll.options[option]?.votes || 0;
    if (!poll.voter_count) {
        return 0;
    }
    return Math.floor(((votes * 100) + Math.floor(poll.voter_count / 2)) / poll.voter_count);
}

// myVotesFromVoters returns the answers a user voted for, from who voted for what (not anonymous polls).
export function myVotesFromVoters(poll: Poll, userId: string): number[] {
    const mine: number[] = [];
    poll.options.forEach((option, i) => {
        if (option.voters?.includes(userId)) {
            mine.push(i);
        }
    });
    return mine;
}

export type EndsIn = {value: number; unit: 'minute' | 'hour' | 'day'};

// endsIn returns how long until a poll ends, in the largest unit that fits, or null when it doesn't
// end (or is closed).
export function endsIn(poll: Poll, now: number): EndsIn | null {
    if (!poll.end_at || poll.closed) {
        return null;
    }
    const minutes = Math.max(1, Math.ceil((poll.end_at - now) / 60000));
    if (minutes < 60) {
        return {value: minutes, unit: 'minute'};
    }
    const hours = Math.round(minutes / 60);
    if (hours < 48) {
        return {value: hours, unit: 'hour'};
    }
    return {value: Math.round(hours / 24), unit: 'day'};
}

// isPollEnded tells whether a poll takes no more votes: closed, or past its end even before the
// server says it's closed.
export function isPollEnded(poll: Poll, now: number): boolean {
    return poll.closed || Boolean(poll.end_at && poll.end_at <= now);
}

// pollVoters returns the users who voted on a poll, once each.
export function pollVoters(poll: Poll): string[] {
    const ids = new Set<string>();
    for (const option of poll.options) {
        option.voters?.forEach((id) => ids.add(id));
    }
    return [...ids];
}

// cleanPollOptions returns the answers of a poll being created: trimmed, without the empty ones.
export function cleanPollOptions(options: string[]): string[] {
    return options.map((o) => o.trim()).filter(Boolean);
}
