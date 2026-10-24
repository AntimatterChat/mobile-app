// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {IntlShape} from 'react-intl';

// formatMeetingTimeRange shows a call's time in the device's own timezone (react-intl's
// formatDate/formatTime already read it from the device, same as the rest of the app), for
// the call post and the Schedule/Day/Week screen.
export function formatMeetingTimeRange(start: number, end: number, intl: IntlShape): string {
    const datePart = intl.formatDate(start, {weekday: 'short', month: 'short', day: 'numeric'});
    const startTime = intl.formatTime(start, {hour: 'numeric', minute: '2-digit'});
    const endTime = intl.formatTime(end, {hour: 'numeric', minute: '2-digit'});
    return `${datePart}, ${startTime}–${endTime}`;
}

export function formatMeetingTime(start: number, intl: IntlShape): string {
    return intl.formatTime(start, {hour: 'numeric', minute: '2-digit'});
}
