// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {IntlShape} from 'react-intl';

import {BURN_DEFAULT_MAXIMUM_DURATION_SECONDS, BURN_DURATION_STEPS_SECONDS, BURN_MIN_DURATION_SECONDS} from '@constants/post';

const DAY = 24 * 60 * 60;
const HOUR = 60 * 60;

// burnLimitSeconds is the longest a sender may pick: the administrator's maximum (borMaximumDurationSeconds), never
// longer than an unopened message lives (the maximum time to live), past which a longer duration would change
// nothing.
export function burnLimitSeconds(config: Pick<PostBoRConfig, 'borMaximumDurationSeconds' | 'borMaximumTimeToLiveSeconds'>): number {
    const max = config.borMaximumDurationSeconds || BURN_DEFAULT_MAXIMUM_DURATION_SECONDS;
    const ttl = config.borMaximumTimeToLiveSeconds;
    return ttl ? Math.min(max, ttl) : max;
}

// clampBurnDurationSeconds keeps a duration between a minute and the limit, to the second, as the server does.
export function clampBurnDurationSeconds(seconds: number, limit: number): number {
    const lowest = Math.min(BURN_MIN_DURATION_SECONDS, limit);
    if (!Number.isFinite(seconds)) {
        return lowest;
    }
    return Math.min(limit, Math.max(lowest, Math.round(seconds)));
}

// burnDurationSteps are the picker's steps the limit allows: the ones above it are hidden.
export function burnDurationSteps(limit: number): number[] {
    return BURN_DURATION_STEPS_SECONDS.filter((s) => s <= limit);
}

// formatBurnDuration says a duration in the largest whole unit: "15 min", "4 h", "1 day".
export function formatBurnDuration(seconds: number, intl: IntlShape): string {
    const {formatMessage} = intl;
    if (seconds % DAY === 0) {
        return formatMessage({id: 'burn_duration.days', defaultMessage: '{count, plural, one {# day} other {# days}}'}, {count: seconds / DAY});
    }
    if (seconds >= HOUR && seconds % HOUR === 0) {
        return formatMessage({id: 'burn_duration.hours', defaultMessage: '{count, plural, one {# hour} other {# hours}}'}, {count: seconds / HOUR});
    }
    if (seconds >= 60) {
        return formatMessage({id: 'burn_duration.minutes', defaultMessage: '{count, plural, one {# minute} other {# minutes}}'}, {count: Math.round(seconds / 60)});
    }
    return formatMessage({id: 'burn_duration.seconds', defaultMessage: '{count, plural, one {# second} other {# seconds}}'}, {count: seconds});
}
