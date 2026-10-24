// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {groupOccurrencesByDay} from './schedule';

import type {MeetingOccurrence} from '../types/calendar';

const occurrence = (overrides: Partial<MeetingOccurrence>): MeetingOccurrence => ({
    meeting_id: 'm1',
    post_id: 'p1',
    channel_id: 'c1',
    channel_name: 'standup',
    channel_display_name: 'Standup',
    channel_type: 'O',
    organizer_id: 'u1',
    summary: 'Call',
    start: 0,
    end: 0,
    recurring: false,
    ...overrides,
});

describe('groupOccurrencesByDay', () => {
    const now = new Date(2026, 9, 21, 9, 0, 0);

    it('groups into Today, Tomorrow and a later date, sorted by day then time', () => {
        const today = new Date(2026, 9, 21, 14, 0, 0).getTime();
        const todayEarlier = new Date(2026, 9, 21, 10, 0, 0).getTime();
        const tomorrow = new Date(2026, 9, 22, 9, 0, 0).getTime();
        const later = new Date(2026, 9, 25, 9, 0, 0).getTime();

        const groups = groupOccurrencesByDay([
            occurrence({meeting_id: 'a', start: today, end: today}),
            occurrence({meeting_id: 'b', start: todayEarlier, end: todayEarlier}),
            occurrence({meeting_id: 'c', start: tomorrow, end: tomorrow}),
            occurrence({meeting_id: 'd', start: later, end: later}),
        ], now);

        expect(groups.map((g) => g.label)).toEqual(['today', 'tomorrow', 'date']);
        expect(groups[0].occurrences.map((o) => o.meeting_id)).toEqual(['b', 'a']);
        expect(groups[1].occurrences.map((o) => o.meeting_id)).toEqual(['c']);
        expect(groups[2].occurrences.map((o) => o.meeting_id)).toEqual(['d']);
    });

    it('returns no groups for no occurrences', () => {
        expect(groupOccurrencesByDay([], now)).toEqual([]);
    });
});
