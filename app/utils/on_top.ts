// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages, type IntlShape} from 'react-intl';

// Antimatter: messages put on top of a channel, shown in a strip above the channel's messages,
// each for a while or until removed.

export type OnTopDuration = '1h' | '4h' | '1d' | '1w' | 'forever';

const HOUR = 3600000;

// The times a message can be put on top for, as in the Fusion web UI: 0 is until removed.
export const ON_TOP_DURATIONS: Array<[OnTopDuration, number]> = [
    ['1h', HOUR],
    ['4h', 4 * HOUR],
    ['1d', 24 * HOUR],
    ['1w', 7 * 24 * HOUR],
    ['forever', 0],
];

export const onTopMessages = defineMessages({
    put: {id: 'mobile.on_top.put', defaultMessage: 'Put on top'},
    change: {id: 'mobile.on_top.change', defaultMessage: 'On top · change'},
    menuLabel: {id: 'mobile.on_top.menu_label', defaultMessage: 'Keep on top of the channel'},
    remove: {id: 'mobile.on_top.remove', defaultMessage: 'Remove from top'},
    duration1h: {id: 'mobile.on_top.duration.1h', defaultMessage: 'For 1 hour'},
    duration4h: {id: 'mobile.on_top.duration.4h', defaultMessage: 'For 4 hours'},
    duration1d: {id: 'mobile.on_top.duration.1d', defaultMessage: 'For 1 day'},
    duration1w: {id: 'mobile.on_top.duration.1w', defaultMessage: 'For 1 week'},
    durationForever: {id: 'mobile.on_top.duration.forever', defaultMessage: 'Until removed'},
    leftForever: {id: 'mobile.on_top.left.forever', defaultMessage: 'until removed'},
    leftDays: {id: 'mobile.on_top.left.days', defaultMessage: '{days}d {hours}h left'},
    leftHours: {id: 'mobile.on_top.left.hours', defaultMessage: '{hours}h {minutes}m left'},
    leftMinutes: {id: 'mobile.on_top.left.minutes', defaultMessage: '{minutes}m left'},
    putToast: {id: 'mobile.on_top.toast.put', defaultMessage: '{direct, select, yes {On top of the conversation} other {On top of #{name}}} {duration, select, hour {for 1 hour} fourHours {for 4 hours} day {for 1 day} week {for 1 week} other {until removed}}'},
    removedToast: {id: 'mobile.on_top.toast.removed', defaultMessage: 'Removed from the top of the channel'},
    putFailed: {id: 'mobile.on_top.failed', defaultMessage: 'The message couldn\'t be put on top'},
    removeFailed: {id: 'mobile.on_top.remove_failed', defaultMessage: 'The message couldn\'t be taken off the top'},
});

const DURATION_MESSAGES = {
    '1h': onTopMessages.duration1h,
    '4h': onTopMessages.duration4h,
    '1d': onTopMessages.duration1d,
    '1w': onTopMessages.duration1w,
    forever: onTopMessages.durationForever,
};

const TOAST_DURATIONS = {
    '1h': 'hour',
    '4h': 'fourHours',
    '1d': 'day',
    '1w': 'week',
    forever: 'forever',
};

export function durationLabel(intl: IntlShape, duration: OnTopDuration): string {
    return intl.formatMessage(DURATION_MESSAGES[duration]);
}

// putOnTopToast is what's said once a message is on top: "On top of #general for 1 hour".
export function putOnTopToast(intl: IntlShape, duration: OnTopDuration, channel?: {type: string; displayName: string}) {
    const direct = channel?.type === 'D' || channel?.type === 'G';
    return intl.formatMessage(onTopMessages.putToast, {
        direct: direct ? 'yes' : 'no',
        name: channel?.displayName ?? '',
        duration: TOAST_DURATIONS[duration],
    });
}

// isOnTopActive tells whether a message is still on top at a time: it stays until removed, or until it expires.
export function isOnTopActive(entry: OnTopPost, now: number): boolean {
    return !entry.expires_at || entry.expires_at > now;
}

// activeOnTop leaves out the messages whose time on top ended.
export function activeOnTop(list: OnTopPost[], now: number): OnTopPost[] {
    return list.filter((o) => isOnTopActive(o, now));
}

// nextExpiry is when the first of the messages still on top expires, if any does.
export function nextExpiry(list: OnTopPost[], now: number): number | undefined {
    let next: number | undefined;
    for (const o of list) {
        if (o.expires_at > now && (next === undefined || o.expires_at < next)) {
            next = o.expires_at;
        }
    }
    return next;
}

// OnTopChange is a message put on top of its channel (again, or with a new time), or taken off it.
export type OnTopChange =
    {type: 'put'; entry: OnTopPost} |
    {type: 'removed'; channelId: string; postId: string};

// applyOnTopChange gives a channel's messages on top after a change, the latest put there first.
// Changes are idempotent: applying one the list already has gives the same list.
export function applyOnTopChange(list: OnTopPost[], change: OnTopChange): OnTopPost[] {
    if (change.type === 'put') {
        const others = list.filter((o) => o.post_id !== change.entry.post_id);
        return [change.entry, ...others].sort((a, b) => b.create_at - a.create_at);
    }
    if (!list.some((o) => o.post_id === change.postId)) {
        return list;
    }
    return list.filter((o) => o.post_id !== change.postId);
}

// timeLeft tells how long a message stays on top, as in the Fusion web UI: "2d 3h left",
// "3h 20m left", "5m left", or "until removed".
export function timeLeft(intl: IntlShape, expiresAt: number, now: number): string {
    if (!expiresAt) {
        return intl.formatMessage(onTopMessages.leftForever);
    }
    const minutes = Math.round(Math.max(0, expiresAt - now) / 60000);
    if (minutes >= 1440) {
        return intl.formatMessage(onTopMessages.leftDays, {days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60)});
    }
    if (minutes >= 60) {
        return intl.formatMessage(onTopMessages.leftHours, {hours: Math.floor(minutes / 60), minutes: minutes % 60});
    }
    return intl.formatMessage(onTopMessages.leftMinutes, {minutes: Math.max(1, minutes)});
}
