// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages, type MessageDescriptor} from 'react-intl';

// Channel mutes have no end in Mattermost: Antimatter's timed mutes keep their end in this preference (named by the
// channel id, valued with the end in milliseconds), and the clients unmute the channel once it's past, as Fusion does.
export const CATEGORY_MUTE_UNTIL = 'fusion_mute_until';

const HOUR = 3600 * 1000;

const durationMessages = defineMessages({
    hour: {id: 'timed_mute.1h', defaultMessage: 'For 1 hour'},
    hours: {id: 'timed_mute.8h', defaultMessage: 'For 8 hours'},
    day: {id: 'timed_mute.1d', defaultMessage: 'For 24 hours'},
    week: {id: 'timed_mute.1w', defaultMessage: 'For a week'},
    forever: {id: 'timed_mute.forever', defaultMessage: 'Until I turn it back on'},
});

// The mute durations offered, as Fusion's, in milliseconds; 0 is until unmuted.
export const MUTE_DURATIONS: Array<[number, MessageDescriptor]> = [
    [HOUR, durationMessages.hour],
    [8 * HOUR, durationMessages.hours],
    [24 * HOUR, durationMessages.day],
    [7 * 24 * HOUR, durationMessages.week],
    [0, durationMessages.forever],
];

// muteEnd reads when a timed mute ends from its preference's value, or 0.
export function muteEnd(value?: string): number {
    return Number(value) || 0;
}
