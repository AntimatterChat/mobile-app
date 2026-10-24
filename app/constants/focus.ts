// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Focus mode (Antimatter): Do not disturb for a while, with a reason shown as the custom status (the dart emoji).
// While someone focuses, the server keeps the end of their focus (milliseconds) in their focus_until user prop,
// which every client sees on the user: their status dot turns purple. For themself, their unread badges hide until
// the end, and then until they've seen the summary of what they missed.

// The user prop the server sets while someone focuses.
export const FOCUS_UNTIL_PROP = 'focus_until';

// The summary last seen, across devices: the preference holding the start of that focus.
export const FOCUS_PREF_CATEGORY = 'focus';
export const FOCUS_PREF_SEEN = 'summary_seen';

// Fusion's matter colour: the purple status dot while focusing.
export const FOCUS_COLOR = '#8B5CF6';

// The reason becomes the custom status: its length.
export const FOCUS_REASON_MAX = 100;

// The longest and shortest a focus may last, as the server enforces.
export const FOCUS_MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const FOCUS_MIN_DURATION_MS = 60 * 1000;

export type FocusDurationChoice = {
    key: string;
    duration?: string;
    minutes?: number;
};

// The start dialog's duration chips: 15 min to 6 h, until tomorrow (09:00 the user's time), or a custom time.
export const FOCUS_DURATIONS: FocusDurationChoice[] = [
    {key: '15m', duration: '15m', minutes: 15},
    {key: '30m', duration: '30m', minutes: 30},
    {key: '1h', duration: '1h', minutes: 60},
    {key: '2h', duration: '2h', minutes: 120},
    {key: '3h', duration: '3h', minutes: 180},
    {key: '4h', duration: '4h', minutes: 240},
    {key: '5h', duration: '5h', minutes: 300},
    {key: '6h', duration: '6h', minutes: 360},
    {key: 'tomorrow', duration: 'tomorrow'},
    {key: 'custom'},
];

export default {
    FOCUS_UNTIL_PROP,
    FOCUS_PREF_CATEGORY,
    FOCUS_PREF_SEEN,
    FOCUS_COLOR,
    FOCUS_REASON_MAX,
    FOCUS_MAX_DURATION_MS,
    FOCUS_MIN_DURATION_MS,
    FOCUS_DURATIONS,
};
