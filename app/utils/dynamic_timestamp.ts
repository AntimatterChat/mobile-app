// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Dynamic timestamps, as Discord's <t:1700000000:R>, are shown in each reader's own time zone and format, as Fusion
// does: t short time, T long time, d short date, D long date, f date and time (the default), F with the weekday, R
// relative ("in 3 hours").
export const TIMESTAMP_PATTERN = /<t:(-?\d{1,13})(?::([tTdDfFR]))?>/g;

export type TimestampStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

const FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
    t: {timeStyle: 'short'},
    T: {timeStyle: 'medium'},
    d: {dateStyle: 'short'},
    D: {dateStyle: 'long'},
    f: {dateStyle: 'long', timeStyle: 'short'},
    F: {dateStyle: 'full', timeStyle: 'short'},
};

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1],
];

type Options = {
    locale?: string;

    // The reader's time zone, or the device's when not set.
    timeZone?: string;
    hour12?: boolean;
    now?: number;
};

// formatTimestamp shows a dynamic timestamp, or '' when it isn't a date.
export function formatTimestamp(seconds: number, style: string = 'f', {locale, timeZone, hour12, now = Date.now()}: Options = {}): string {
    const date = new Date(seconds * 1000);
    if (isNaN(date.getTime())) {
        return '';
    }
    if (style === 'R') {
        const diff = (date.getTime() - now) / 1000;
        const [unit, size] = RELATIVE_UNITS.find(([, n]) => Math.abs(diff) >= n) || RELATIVE_UNITS[RELATIVE_UNITS.length - 1];
        return new Intl.RelativeTimeFormat(locale, {numeric: 'auto'}).format(Math.round(diff / size), unit);
    }
    const format = FORMATS[style] || FORMATS.f;
    const withClock = 'timeStyle' in format ? {hour12} : {};
    try {
        return new Intl.DateTimeFormat(locale, {...format, ...withClock, timeZone: timeZone || undefined}).format(date);
    } catch {
        // A time zone this device doesn't know: the device's own.
        return new Intl.DateTimeFormat(locale, {...format, ...withClock}).format(date);
    }
}

export type FoundTimestamp = {index: number; text: string; seconds: number; style: TimestampStyle};

// findTimestamps finds the dynamic timestamps of a text.
export function findTimestamps(text: string): FoundTimestamp[] {
    const found: FoundTimestamp[] = [];
    if (!text.includes('<t:')) {
        return found;
    }
    TIMESTAMP_PATTERN.lastIndex = 0;
    for (let m = TIMESTAMP_PATTERN.exec(text); m; m = TIMESTAMP_PATTERN.exec(text)) {
        found.push({index: m.index, text: m[0], seconds: Number(m[1]), style: (m[2] || 'f') as TimestampStyle});
    }
    return found;
}

// formatTimestampsInText shows the dynamic timestamps of a plain text, as for one-line excerpts of messages.
export function formatTimestampsInText(text: string, options: Options = {}): string {
    if (!text.includes('<t:')) {
        return text;
    }
    return text.replace(TIMESTAMP_PATTERN, (match: string, seconds: string, style?: string) => formatTimestamp(Number(seconds), style, options) || match);
}
