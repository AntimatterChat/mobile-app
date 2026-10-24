// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages, type IntlShape} from 'react-intl';

import {NEXT_CALL_SOON_WINDOW_MS} from '../constants';

import type {NextMeeting} from '../types/calendar';

// The channel header chip's three states ("Next call: Tue 14:00 · Title", then "in N min"
// in the call's last hour, then "Live · Join" while it runs), computed from the server's
// own next-call read (GET /channels/{id}/meetings/next) and the device's clock. Pure so the
// three states, and the moments they flip at, are simple to test.

export type ChipPhase = 'upcoming' | 'soon' | 'live';

export function computeChipPhase(next: NextMeeting, now: number): ChipPhase {
    if (next.live || (now >= next.start && now < next.end)) {
        return 'live';
    }
    if (next.start - now <= NEXT_CALL_SOON_WINDOW_MS) {
        return 'soon';
    }
    return 'upcoming';
}

export function minutesUntil(startMs: number, now: number): number {
    return Math.max(0, Math.ceil((startMs - now) / 60000));
}

const chipMessages = defineMessages({
    upcoming: {id: 'calendar.chip.upcoming', defaultMessage: 'Next call: {time} · {title}'},
    soon: {id: 'calendar.chip.soon', defaultMessage: 'In {n, plural, one {# min} other {# min}} · {title}'},
    live: {id: 'calendar.chip.live', defaultMessage: 'Live · {title}'},
    join: {id: 'calendar.chip.join', defaultMessage: 'Join'},
});

export function describeChip(next: NextMeeting, now: number, intl: IntlShape): {phase: ChipPhase; label: string} {
    const phase = computeChipPhase(next, now);
    if (phase === 'live') {
        return {phase, label: intl.formatMessage(chipMessages.live, {title: next.summary})};
    }
    if (phase === 'soon') {
        return {phase, label: intl.formatMessage(chipMessages.soon, {n: minutesUntil(next.start, now), title: next.summary})};
    }
    const time = intl.formatDate(next.start, {weekday: 'short', hour: 'numeric', minute: '2-digit'});
    return {phase, label: intl.formatMessage(chipMessages.upcoming, {time, title: next.summary})};
}

export const chipJoinLabel = chipMessages.join;
