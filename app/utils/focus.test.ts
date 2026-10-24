// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {General} from '@constants';
import {FOCUS_UNTIL_PROP} from '@constants/focus';

import {focusUntil, isFocusing, tomorrowAt9} from './focus';

describe('focusUntil', () => {
    it('returns 0 when there is no user', () => {
        expect(focusUntil(undefined)).toBe(0);
    });

    it('returns 0 when the prop is missing', () => {
        expect(focusUntil({props: {}})).toBe(0);
    });

    it('returns 0 when the prop is not a positive number', () => {
        expect(focusUntil({props: {[FOCUS_UNTIL_PROP]: '0'}})).toBe(0);
        expect(focusUntil({props: {[FOCUS_UNTIL_PROP]: 'not-a-number'}})).toBe(0);
        expect(focusUntil({props: {[FOCUS_UNTIL_PROP]: -5}})).toBe(0);
    });

    it('returns the prop as a number', () => {
        expect(focusUntil({props: {[FOCUS_UNTIL_PROP]: 1234567890}})).toBe(1234567890);
        expect(focusUntil({props: {[FOCUS_UNTIL_PROP]: '1234567890'}})).toBe(1234567890);
    });
});

describe('isFocusing', () => {
    it('is false when not Do not disturb', () => {
        expect(isFocusing({status: General.ONLINE, props: {[FOCUS_UNTIL_PROP]: Date.now() + 60000}})).toBe(false);
    });

    it('is false when Do not disturb but the marker has passed', () => {
        expect(isFocusing({status: General.DND, props: {[FOCUS_UNTIL_PROP]: Date.now() - 60000}})).toBe(false);
    });

    it('is false when Do not disturb with no marker', () => {
        expect(isFocusing({status: General.DND, props: {}})).toBe(false);
    });

    it('is true while Do not disturb with the marker still ahead', () => {
        expect(isFocusing({status: General.DND, props: {[FOCUS_UNTIL_PROP]: Date.now() + 60000}})).toBe(true);
    });
});

describe('tomorrowAt9', () => {
    it('is 09:00 the next day in the zone given', () => {
        // 2026-10-24 12:00 UTC.
        const now = new Date('2026-10-24T12:00:00Z').getTime();
        const result = tomorrowAt9('UTC', now);
        const d = new Date(result);
        expect(d.getUTCFullYear()).toBe(2026);
        expect(d.getUTCMonth()).toBe(9);
        expect(d.getUTCDate()).toBe(25);
        expect(d.getUTCHours()).toBe(9);
        expect(d.getUTCMinutes()).toBe(0);
    });

    it('falls back to the device zone when none is given', () => {
        const now = Date.now();
        const result = tomorrowAt9('', now);
        expect(result).toBeGreaterThan(now);
    });
});
