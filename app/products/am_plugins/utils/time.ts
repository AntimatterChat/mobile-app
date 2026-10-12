// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type RelativeUnit = 'minute' | 'hour' | 'day';

// timeAgo returns the time since a past moment in the largest unit that fits, as the arguments of
// formatRelativeTime ("5 minutes ago", "3 hours ago", "2 days ago").
export function timeAgo(at: number, now = Date.now()): [number, RelativeUnit] {
    const minutes = Math.round((now - at) / 60000);
    if (minutes < 60) {
        return [-Math.max(1, minutes), 'minute'];
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return [-hours, 'hour'];
    }
    return [-Math.round(hours / 24), 'day'];
}
