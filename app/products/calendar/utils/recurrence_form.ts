// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Builds and reads the edit form's repeat fields (daily, weekly on days, monthly, every N,
// ending never / on a date / after N), to and from the RRULE recurrence_rule
// .meetings_api_ref.md describes. The editor only ever writes what the web app does
// (FREQ, INTERVAL, BYDAY, UNTIL, COUNT): see describeRecurrence for reading any rule.

import {isCustomRecurrenceRule, parseRecurrenceRule} from './recurrence';

// 'CUSTOM' is a rule the builder can't represent (YEARLY, BYSETPOS, ...): the form shows it
// as "Custom (kept as is)" and, like the web dialog, saves it back byte-for-byte unless the
// organiser explicitly picks one of the other options.
export type RecurrenceFormFreq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type RecurrenceEndType = 'never' | 'on_date' | 'after_n';

export type RecurrenceFormFields = {
    freq: RecurrenceFormFreq;
    interval: number;
    byDay: string[];
    endType: RecurrenceEndType;
    until?: number;
    count: number;

    // The original RRULE, kept only so a 'CUSTOM' rule can be saved back unchanged; absent
    // otherwise.
    originalRule?: string;
};

export const DEFAULT_RECURRENCE_FORM: RecurrenceFormFields = {
    freq: 'NONE',
    interval: 1,
    byDay: [],
    endType: 'never',
    count: 10,
};

// buildRecurrenceRule turns the form's fields into an RRULE string ('' for "no recurrence").
// A 'CUSTOM' rule is returned exactly as read, never rebuilt from the (irrelevant, default)
// interval/byDay/endType fields.
export function buildRecurrenceRule(fields: RecurrenceFormFields): string {
    if (fields.freq === 'CUSTOM') {
        return fields.originalRule ?? '';
    }
    if (fields.freq === 'NONE') {
        return '';
    }

    const parts = [`FREQ=${fields.freq}`];
    if (fields.interval > 1) {
        parts.push(`INTERVAL=${fields.interval}`);
    }
    if (fields.freq === 'WEEKLY' && fields.byDay.length) {
        parts.push(`BYDAY=${fields.byDay.join(',')}`);
    }
    if (fields.endType === 'on_date' && fields.until) {
        const d = new Date(fields.until);
        const pad = (n: number) => String(n).padStart(2, '0');
        parts.push(`UNTIL=${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`);
    } else if (fields.endType === 'after_n' && fields.count > 0) {
        parts.push(`COUNT=${fields.count}`);
    }

    return parts.join(';');
}

// recurrenceFormFromRule pre-fills the edit form from an existing call. A rule the builder
// can't represent (isCustomRecurrenceRule) becomes 'CUSTOM', carrying the original RRULE
// forward untouched, rather than guessing at a lossy equivalent that buildRecurrenceRule
// would then save back as a *different* rule.
export function recurrenceFormFromRule(rule: string | undefined): RecurrenceFormFields {
    if (!rule) {
        return {...DEFAULT_RECURRENCE_FORM};
    }

    if (isCustomRecurrenceRule(rule)) {
        return {...DEFAULT_RECURRENCE_FORM, freq: 'CUSTOM', originalRule: rule};
    }

    // Not custom, so by isCustomRecurrenceRule's own contract this parses and its freq is
    // one of DAILY/WEEKLY/MONTHLY — the same set RecurrenceFormFreq models (minus NONE and
    // CUSTOM, neither of which parseRecurrenceRule ever returns).
    const parsed = parseRecurrenceRule(rule)!;
    const freq = parsed.freq as 'DAILY' | 'WEEKLY' | 'MONTHLY';

    let endType: RecurrenceEndType = 'never';
    if (parsed.until) {
        endType = 'on_date';
    } else if (parsed.count) {
        endType = 'after_n';
    }

    return {
        freq,
        interval: parsed.interval,
        byDay: parsed.byDay ?? [],
        endType,
        until: parsed.until,
        count: parsed.count ?? DEFAULT_RECURRENCE_FORM.count,
    };
}
