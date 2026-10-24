// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getIntlShape} from '@utils/general';

import {burnDurationSteps, burnLimitSeconds, clampBurnDurationSeconds, formatBurnDuration} from './burn_duration';

describe('burnLimitSeconds', () => {
    it('is the configured maximum when there is no time-to-live', () => {
        expect(burnLimitSeconds({borMaximumDurationSeconds: 3600, borMaximumTimeToLiveSeconds: 0})).toBe(3600);
    });

    it('falls back to the default maximum when none is configured', () => {
        expect(burnLimitSeconds({borMaximumDurationSeconds: 0, borMaximumTimeToLiveSeconds: 0})).toBe(86400);
    });

    it('is capped by the time-to-live when that is shorter', () => {
        expect(burnLimitSeconds({borMaximumDurationSeconds: 3600, borMaximumTimeToLiveSeconds: 1800})).toBe(1800);
    });

    it('ignores a longer time-to-live', () => {
        expect(burnLimitSeconds({borMaximumDurationSeconds: 3600, borMaximumTimeToLiveSeconds: 7200})).toBe(3600);
    });
});

describe('clampBurnDurationSeconds', () => {
    it('keeps a duration within a minute and the limit', () => {
        expect(clampBurnDurationSeconds(30, 3600)).toBe(60);
        expect(clampBurnDurationSeconds(7200, 3600)).toBe(3600);
        expect(clampBurnDurationSeconds(1800, 3600)).toBe(1800);
    });

    it('rounds to the second', () => {
        expect(clampBurnDurationSeconds(90.6, 3600)).toBe(91);
    });

    it('falls back to the lowest when given something that is not a number', () => {
        expect(clampBurnDurationSeconds(NaN, 3600)).toBe(60);
    });

    it('lowers the floor when the limit itself is under a minute', () => {
        expect(clampBurnDurationSeconds(5, 30)).toBe(30);
    });
});

describe('burnDurationSteps', () => {
    it('hides the steps above the limit', () => {
        expect(burnDurationSteps(1800)).toEqual([60, 900, 1800]);
    });

    it('keeps every step under the default maximum', () => {
        expect(burnDurationSteps(86400)).toEqual([60, 900, 1800, 3600, 14400, 86400]);
    });
});

describe('formatBurnDuration', () => {
    const intl = getIntlShape();

    it('formats seconds under a minute', () => {
        expect(formatBurnDuration(30, intl)).toBe('30 seconds');
    });

    it('formats whole minutes', () => {
        expect(formatBurnDuration(60, intl)).toBe('1 minute');
        expect(formatBurnDuration(900, intl)).toBe('15 minutes');
    });

    it('formats whole hours', () => {
        expect(formatBurnDuration(3600, intl)).toBe('1 hour');
        expect(formatBurnDuration(14400, intl)).toBe('4 hours');
    });

    it('formats whole days', () => {
        expect(formatBurnDuration(86400, intl)).toBe('1 day');
        expect(formatBurnDuration(172800, intl)).toBe('2 days');
    });
});
