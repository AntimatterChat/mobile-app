// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {hasLiveOccurrence} from './live';

import type {MeetingOccurrence} from '../types/calendar';

const occurrence = (start: number, end: number): MeetingOccurrence => ({
    meeting_id: 'm',
    post_id: 'p',
    channel_id: 'c',
    channel_name: 'c',
    channel_display_name: 'C',
    channel_type: 'O',
    organizer_id: 'u',
    summary: 's',
    start,
    end,
    recurring: false,
});

describe('hasLiveOccurrence', () => {
    it('is false for no occurrences', () => {
        expect(hasLiveOccurrence([], Date.now())).toBe(false);
    });

    it('is true when now is within one occurrence', () => {
        expect(hasLiveOccurrence([occurrence(0, 1000)], 500)).toBe(true);
    });

    it('is false once the occurrence has ended (end is exclusive)', () => {
        expect(hasLiveOccurrence([occurrence(0, 1000)], 1000)).toBe(false);
    });

    it('is false before any occurrence starts', () => {
        expect(hasLiveOccurrence([occurrence(1000, 2000)], 500)).toBe(false);
    });
});
