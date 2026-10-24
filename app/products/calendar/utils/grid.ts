// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Pure date-grid math for the Day and Week screens: the hour grid they share, laid out from
// epoch milliseconds so a daylight-saving transition (a 23- or 25-hour day) positions blocks
// correctly instead of assuming every day is 24 hours.

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

export type GridMode = 'day' | 'week';

// advanceDate is a swipe's effect: one day (Day screen) or one week (Week screen), in
// either direction.
export function advanceDate(date: Date, mode: GridMode, direction: 1 | -1): Date {
    return mode === 'day' ? addDays(date, direction) : addDays(date, direction * 7);
}

// getFirstDayOfWeek reads the locale's first day of week from the device region. Most of
// the world starts on Monday; a short list of regions start on Sunday or Saturday.
const SUNDAY_START_REGIONS = new Set(['US', 'CA', 'MX', 'BR', 'JP', 'KR', 'TW', 'HK', 'PH', 'ZA', 'IL', 'IN', 'PK', 'AU', 'NZ']);
const SATURDAY_START_REGIONS = new Set(['AE', 'SA', 'EG', 'QA', 'BH', 'KW', 'OM', 'JO', 'SY', 'IQ', 'LY', 'DZ', 'MA', 'TN', 'YE', 'AF']);

export function getFirstDayOfWeek(countryCode: string | undefined): DayOfWeek {
    const code = countryCode?.toUpperCase();
    if (!code) {
        return 1;
    }
    if (SUNDAY_START_REGIONS.has(code)) {
        return 0;
    }
    if (SATURDAY_START_REGIONS.has(code)) {
        return 6;
    }
    return 1;
}

export function startOfWeek(date: Date, firstDay: DayOfWeek): Date {
    const d = startOfDay(date);
    const diff = (d.getDay() - firstDay + 7) % 7;
    return addDays(d, -diff);
}

export function weekDays(weekStart: Date): Date[] {
    return Array.from({length: 7}, (_, i) => addDays(weekStart, i));
}

// dayLengthMs is 24h, except on a DST transition day (23h or 25h), computed from the two
// local midnights rather than assumed.
export function dayLengthMs(dayStart: Date): number {
    return addDays(dayStart, 1).getTime() - dayStart.getTime();
}

// nowLineFraction is the now-line's position (0..1 down the day), or null when `now` isn't
// on this day.
export function nowLineFraction(dayStart: Date, now: number): number | null {
    const length = dayLengthMs(dayStart);
    const offset = now - dayStart.getTime();
    if (offset < 0 || offset >= length) {
        return null;
    }
    return offset / length;
}

export type EventSpan = {
    start: number;
    end: number;
};

// eventFraction is a block's position and height (0..1 down the day), clipped to the day
// (an occurrence can't cross midnight server-side, but this stays safe if one ever did).
export function eventFraction(span: EventSpan, dayStart: Date): {top: number; height: number} {
    const length = dayLengthMs(dayStart);
    const top = Math.max(0, (span.start - dayStart.getTime()) / length);
    const bottom = Math.min(1, (span.end - dayStart.getTime()) / length);
    return {top, height: Math.max(0, bottom - top)};
}

export type DayLayoutItem<T> = {
    item: T;
    column: number;
    columns: number;
    top: number;
    height: number;
};

// layoutDayEvents places a day's events in the hour grid: blocks sized by duration,
// overlapping ones side by side (within their own cluster of mutually-overlapping events,
// not across the whole day).
export function layoutDayEvents<T extends EventSpan>(events: T[], dayStart: Date): Array<DayLayoutItem<T>> {
    const sorted = [...events].sort((a, b) => (a.start - b.start) || (a.end - b.end));

    const clusters: T[][] = [];
    let current: T[] = [];
    let currentEnd = -Infinity;
    for (const e of sorted) {
        if (current.length && e.start >= currentEnd) {
            clusters.push(current);
            current = [];
            currentEnd = -Infinity;
        }
        current.push(e);
        currentEnd = Math.max(currentEnd, e.end);
    }
    if (current.length) {
        clusters.push(current);
    }

    const result: Array<DayLayoutItem<T>> = [];
    for (const cluster of clusters) {
        const columnEnds: number[] = [];
        const colOf = new Map<T, number>();
        for (const e of cluster) {
            let col = columnEnds.findIndex((end) => end <= e.start);
            if (col === -1) {
                col = columnEnds.length;
                columnEnds.push(e.end);
            } else {
                columnEnds[col] = e.end;
            }
            colOf.set(e, col);
        }
        const columns = columnEnds.length;
        for (const e of cluster) {
            const {top, height} = eventFraction(e, dayStart);
            result.push({item: e, column: colOf.get(e) as number, columns, top, height});
        }
    }
    return result;
}
