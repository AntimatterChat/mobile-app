// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildRecurrenceRule, DEFAULT_RECURRENCE_FORM, recurrenceFormFromRule} from './recurrence_form';

describe('buildRecurrenceRule', () => {
    it('returns an empty string for NONE', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'NONE'})).toBe('');
    });

    it('builds a plain daily rule', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'DAILY'})).toBe('FREQ=DAILY');
    });

    it('adds INTERVAL only when greater than 1', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'MONTHLY', interval: 3})).toBe('FREQ=MONTHLY;INTERVAL=3');
    });

    it('adds BYDAY for weekly only', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'WEEKLY', byDay: ['MO', 'TH']})).toBe('FREQ=WEEKLY;BYDAY=MO,TH');
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'DAILY', byDay: ['MO']})).toBe('FREQ=DAILY');
    });

    it('ends on a date', () => {
        const until = Date.UTC(2026, 11, 31, 22, 59, 59);
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'WEEKLY', endType: 'on_date', until})).toBe('FREQ=WEEKLY;UNTIL=20261231T225959Z');
    });

    it('ends after N occurrences', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'DAILY', endType: 'after_n', count: 7})).toBe('FREQ=DAILY;COUNT=7');
    });

    it('never ending adds neither UNTIL nor COUNT', () => {
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'DAILY', endType: 'never'})).toBe('FREQ=DAILY');
    });

    it('returns a CUSTOM rule exactly as read, ignoring the other fields', () => {
        const originalRule = 'FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=15';
        expect(buildRecurrenceRule({...DEFAULT_RECURRENCE_FORM, freq: 'CUSTOM', interval: 3, originalRule})).toBe(originalRule);
    });
});

describe('recurrenceFormFromRule', () => {
    it('is the default form for a one-off call', () => {
        expect(recurrenceFormFromRule(undefined)).toEqual(DEFAULT_RECURRENCE_FORM);
    });

    it('round-trips through buildRecurrenceRule', () => {
        const rule = 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TH;COUNT=10';
        const form = recurrenceFormFromRule(rule);
        expect(buildRecurrenceRule(form)).toBe(rule);
    });

    it('treats a YEARLY rule as CUSTOM, keeping it verbatim rather than guessing', () => {
        const rule = 'FREQ=YEARLY;INTERVAL=2';
        const form = recurrenceFormFromRule(rule);
        expect(form.freq).toBe('CUSTOM');
        expect(form.originalRule).toBe(rule);
        expect(buildRecurrenceRule(form)).toBe(rule);
    });

    it('treats an unmodelled RRULE part (BYSETPOS) as CUSTOM', () => {
        const rule = 'FREQ=MONTHLY;BYSETPOS=-1;BYDAY=FR';
        const form = recurrenceFormFromRule(rule);
        expect(form.freq).toBe('CUSTOM');
        expect(buildRecurrenceRule(form)).toBe(rule);
    });

    it('a CUSTOM rule is kept unchanged even if other fields are edited in the UI', () => {
        const rule = 'FREQ=YEARLY';
        const form = recurrenceFormFromRule(rule);
        const edited = {...form, interval: 5, byDay: ['MO'], count: 99};
        expect(buildRecurrenceRule(edited)).toBe(rule);
    });
});
