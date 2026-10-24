// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {describeRecurrence, parseRecurrenceRule} from './recurrence';

const intl = createIntl({locale: 'en'});

describe('parseRecurrenceRule', () => {
    it('returns null for an empty or missing rule', () => {
        expect(parseRecurrenceRule('')).toBeNull();
        expect(parseRecurrenceRule(undefined)).toBeNull();
    });

    it('returns null for an unrecognised FREQ', () => {
        expect(parseRecurrenceRule('FREQ=HOURLY')).toBeNull();
    });

    it('parses FREQ, INTERVAL and BYDAY', () => {
        expect(parseRecurrenceRule('FREQ=WEEKLY;BYDAY=MO,TH;COUNT=10')).toEqual({
            freq: 'WEEKLY',
            interval: 1,
            byDay: ['MO', 'TH'],
            count: 10,
        });
    });

    it('parses INTERVAL and UNTIL', () => {
        const parsed = parseRecurrenceRule('FREQ=DAILY;INTERVAL=2;UNTIL=20261231T225959Z');
        expect(parsed?.freq).toBe('DAILY');
        expect(parsed?.interval).toBe(2);
        expect(parsed?.until).toBe(Date.UTC(2026, 11, 31, 22, 59, 59));
    });
});

describe('describeRecurrence', () => {
    it('returns undefined for a one-off call', () => {
        expect(describeRecurrence(undefined, intl)).toBeUndefined();
        expect(describeRecurrence('', intl)).toBeUndefined();
    });

    it('describes a simple daily call', () => {
        expect(describeRecurrence('FREQ=DAILY', intl)).toBe('Daily');
    });

    it('describes an interval', () => {
        expect(describeRecurrence('FREQ=DAILY;INTERVAL=2', intl)).toBe('Every 2 days');
    });

    it('describes weekly on days', () => {
        const result = describeRecurrence('FREQ=WEEKLY;BYDAY=MO,TH', intl);
        expect(result).toContain('Weekly on Monday');
        expect(result).toContain('Thursday');
    });

    it('describes monthly with a count', () => {
        expect(describeRecurrence('FREQ=MONTHLY;COUNT=5', intl)).toBe('Monthly, 5 times');
    });

    it('describes an until date', () => {
        const result = describeRecurrence('FREQ=WEEKLY;UNTIL=20261231T225959Z', intl);
        expect(result).toContain('Weekly, ending');
        expect(result).toContain('2026');
    });
});
