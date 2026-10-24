// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages, type IntlShape} from 'react-intl';

// Parses and describes a call's recurrence_rule (an RFC 5545 RRULE), reading only the parts
// the Calendar app's web UI writes (FREQ, INTERVAL, BYDAY, UNTIL, COUNT), as
// .meetings_api_ref.md documents. An empty string (or an unrecognised rule) means "no
// recurrence": callers treat a null return as a one-off call.

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type ParsedRecurrence = {
    freq: RecurrenceFreq;
    interval: number;
    byDay?: string[];
    until?: number;
    count?: number;
};

const FREQS: RecurrenceFreq[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

// parseUntil reads an RRULE UNTIL value (UTC, e.g. "20261231T225959Z") into milliseconds.
function parseUntil(value: string): number | undefined {
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(value);
    if (!match) {
        return undefined;
    }
    const [, y, mo, d, h, mi, s] = match;
    return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

export function parseRecurrenceRule(rule: string | undefined): ParsedRecurrence | null {
    if (!rule) {
        return null;
    }

    const parts: Record<string, string> = {};
    for (const part of rule.split(';')) {
        const [key, value] = part.split('=');
        if (key && value) {
            parts[key.toUpperCase()] = value;
        }
    }

    const freq = parts.FREQ as RecurrenceFreq;
    if (!FREQS.includes(freq)) {
        return null;
    }

    const parsed: ParsedRecurrence = {
        freq,
        interval: parts.INTERVAL ? Math.max(1, parseInt(parts.INTERVAL, 10) || 1) : 1,
    };

    if (parts.BYDAY) {
        parsed.byDay = parts.BYDAY.split(',').map((d) => d.trim().toUpperCase()).filter(Boolean);
    }
    if (parts.UNTIL) {
        parsed.until = parseUntil(parts.UNTIL);
    }
    if (parts.COUNT) {
        const count = parseInt(parts.COUNT, 10);
        if (Number.isFinite(count) && count > 0) {
            parsed.count = count;
        }
    }

    return parsed;
}

// The RRULE parts the edit form's repeat builder can read and write (FREQ ∈
// {DAILY,WEEKLY,MONTHLY}, INTERVAL, BYDAY, UNTIL, COUNT), exactly what the web app itself
// writes per .meetings_api_ref.md.
const EDITABLE_FREQS: RecurrenceFreq[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
const EDITABLE_RRULE_PARTS = new Set(['FREQ', 'INTERVAL', 'BYDAY', 'UNTIL', 'COUNT']);

// isCustomRecurrenceRule tells whether a call's recurrence_rule is one the edit form's
// repeat builder can represent and rebuild losslessly. A YEARLY rule, one with a part the
// builder doesn't model (BYSETPOS, BYMONTHDAY, WKST, ...), or one the builder can't even
// parse, is "custom": the edit form must show it as "Custom (kept as is)" and save it back
// unchanged, rather than silently rebuilding (and so changing) it from a lossy guess, the
// way the web dialog already behaves.
export function isCustomRecurrenceRule(rule: string | undefined): boolean {
    if (!rule) {
        return false;
    }

    const keys = rule.split(';').map((part) => part.split('=')[0]?.trim().toUpperCase()).filter(Boolean);
    if (keys.some((key) => !EDITABLE_RRULE_PARTS.has(key))) {
        return true;
    }

    const parsed = parseRecurrenceRule(rule);
    return !parsed || !EDITABLE_FREQS.includes(parsed.freq);
}

const recurrenceMessages = defineMessages({
    daily: {id: 'calendar.recurrence.daily', defaultMessage: 'Daily'},
    dailyInterval: {id: 'calendar.recurrence.daily_interval', defaultMessage: 'Every {n} days'},
    weekly: {id: 'calendar.recurrence.weekly', defaultMessage: 'Weekly'},
    weeklyInterval: {id: 'calendar.recurrence.weekly_interval', defaultMessage: 'Every {n} weeks'},
    weeklyOn: {id: 'calendar.recurrence.weekly_on', defaultMessage: '{base} on {days}'},
    monthly: {id: 'calendar.recurrence.monthly', defaultMessage: 'Monthly'},
    monthlyInterval: {id: 'calendar.recurrence.monthly_interval', defaultMessage: 'Every {n} months'},
    yearly: {id: 'calendar.recurrence.yearly', defaultMessage: 'Yearly'},
    yearlyInterval: {id: 'calendar.recurrence.yearly_interval', defaultMessage: 'Every {n} years'},
    untilSuffix: {id: 'calendar.recurrence.until', defaultMessage: '{base}, ending {date}'},
    countSuffix: {
        id: 'calendar.recurrence.count',
        defaultMessage: '{base}, {n, plural, one {# time} other {# times}}',
    },
});

export const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

type MessageDescriptor = {id: string; defaultMessage: string};

// defineMessages (not a plain object literal) so the extractor's static analysis picks
// these up: a dynamic DAY_NAME_IDS[code] lookup is fine at runtime, but a literal object
// outside defineMessages/formatMessage is invisible to it. Widened to Record<string, ...>
// so that dynamic lookup (by an RRULE BYDAY code, not always one of the known literals)
// still type-checks.
export const DAY_NAME_IDS: Record<string, MessageDescriptor> = defineMessages({
    MO: {id: 'calendar.recurrence.day.monday', defaultMessage: 'Monday'},
    TU: {id: 'calendar.recurrence.day.tuesday', defaultMessage: 'Tuesday'},
    WE: {id: 'calendar.recurrence.day.wednesday', defaultMessage: 'Wednesday'},
    TH: {id: 'calendar.recurrence.day.thursday', defaultMessage: 'Thursday'},
    FR: {id: 'calendar.recurrence.day.friday', defaultMessage: 'Friday'},
    SA: {id: 'calendar.recurrence.day.saturday', defaultMessage: 'Saturday'},
    SU: {id: 'calendar.recurrence.day.sunday', defaultMessage: 'Sunday'},
});

export const DAY_SHORT_NAME_IDS: Record<string, MessageDescriptor> = defineMessages({
    MO: {id: 'calendar.recurrence.day_short.monday', defaultMessage: 'Mon'},
    TU: {id: 'calendar.recurrence.day_short.tuesday', defaultMessage: 'Tue'},
    WE: {id: 'calendar.recurrence.day_short.wednesday', defaultMessage: 'Wed'},
    TH: {id: 'calendar.recurrence.day_short.thursday', defaultMessage: 'Thu'},
    FR: {id: 'calendar.recurrence.day_short.friday', defaultMessage: 'Fri'},
    SA: {id: 'calendar.recurrence.day_short.saturday', defaultMessage: 'Sat'},
    SU: {id: 'calendar.recurrence.day_short.sunday', defaultMessage: 'Sun'},
});

export function describeWeekdayShort(code: string, intl: IntlShape): string {
    return DAY_SHORT_NAME_IDS[code] ? intl.formatMessage(DAY_SHORT_NAME_IDS[code]) : code;
}

function formatDayList(days: string[], intl: IntlShape): string {
    const names = days.map((d) => (DAY_NAME_IDS[d] ? intl.formatMessage(DAY_NAME_IDS[d]) : d));
    if (typeof Intl !== 'undefined' && 'ListFormat' in Intl) {
        try {
            // eslint-disable-next-line new-cap
            const formatter = new (Intl as unknown as {ListFormat: new (locale: string, opts: {type: string}) => {format: (items: string[]) => string}}).ListFormat(intl.locale, {type: 'conjunction'});
            return formatter.format(names);
        } catch {
            // fall through to the plain join below
        }
    }
    return names.join(', ');
}

// describeRecurrence turns a call's recurrence_rule into words, for the post ("the repeat
// rule in words") and the edit form's summary. Returns undefined for a one-off call.
export function describeRecurrence(rule: string | undefined, intl: IntlShape): string | undefined {
    const parsed = parseRecurrenceRule(rule);
    if (!parsed) {
        return undefined;
    }

    let base: string;
    switch (parsed.freq) {
        case 'DAILY':
            base = parsed.interval > 1 ?
                intl.formatMessage(recurrenceMessages.dailyInterval, {n: parsed.interval}) :
                intl.formatMessage(recurrenceMessages.daily);
            break;
        case 'WEEKLY': {
            base = parsed.interval > 1 ?
                intl.formatMessage(recurrenceMessages.weeklyInterval, {n: parsed.interval}) :
                intl.formatMessage(recurrenceMessages.weekly);
            if (parsed.byDay?.length) {
                base = intl.formatMessage(recurrenceMessages.weeklyOn, {base, days: formatDayList(parsed.byDay, intl)});
            }
            break;
        }
        case 'MONTHLY':
            base = parsed.interval > 1 ?
                intl.formatMessage(recurrenceMessages.monthlyInterval, {n: parsed.interval}) :
                intl.formatMessage(recurrenceMessages.monthly);
            break;
        case 'YEARLY':
        default:
            base = parsed.interval > 1 ?
                intl.formatMessage(recurrenceMessages.yearlyInterval, {n: parsed.interval}) :
                intl.formatMessage(recurrenceMessages.yearly);
            break;
    }

    if (parsed.until) {
        base = intl.formatMessage(recurrenceMessages.untilSuffix, {
            base,
            date: intl.formatDate(parsed.until, {year: 'numeric', month: 'short', day: 'numeric'}),
        });
    } else if (parsed.count) {
        base = intl.formatMessage(recurrenceMessages.countSuffix, {base, n: parsed.count});
    }

    return base;
}
