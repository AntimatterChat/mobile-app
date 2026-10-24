// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    addDays,
    advanceDate,
    dayLengthMs,
    eventFraction,
    getFirstDayOfWeek,
    layoutDayEvents,
    nowLineFraction,
    startOfDay,
    startOfWeek,
    weekDays,
} from './grid';

describe('getFirstDayOfWeek', () => {
    it('defaults to Monday', () => {
        expect(getFirstDayOfWeek(undefined)).toBe(1);
        expect(getFirstDayOfWeek('FR')).toBe(1);
    });

    it('is Sunday for the US', () => {
        expect(getFirstDayOfWeek('US')).toBe(0);
        expect(getFirstDayOfWeek('us')).toBe(0);
    });

    it('is Saturday for Saudi Arabia', () => {
        expect(getFirstDayOfWeek('SA')).toBe(6);
    });
});

describe('startOfWeek / weekDays', () => {
    it('starts on the given first day of week', () => {
        // 2026-10-21 is a Wednesday.
        const wed = new Date(2026, 9, 21);
        const mondayStart = startOfWeek(wed, 1);
        expect(mondayStart.getDay()).toBe(1);
        expect(mondayStart.getDate()).toBe(19);

        const sundayStart = startOfWeek(wed, 0);
        expect(sundayStart.getDay()).toBe(0);
        expect(sundayStart.getDate()).toBe(18);
    });

    it('returns 7 consecutive days from the week start', () => {
        const days = weekDays(startOfWeek(new Date(2026, 9, 21), 1));
        expect(days).toHaveLength(7);
        expect(days[0].getDate()).toBe(19);
        expect(days[6].getDate()).toBe(25);
    });
});

describe('advanceDate', () => {
    it('moves by one day in Day mode', () => {
        const d = new Date(2026, 9, 21);
        expect(advanceDate(d, 'day', 1).getDate()).toBe(22);
        expect(advanceDate(d, 'day', -1).getDate()).toBe(20);
    });

    it('moves by one week in Week mode', () => {
        const d = new Date(2026, 9, 21);
        expect(advanceDate(d, 'week', 1).getDate()).toBe(28);
        expect(advanceDate(d, 'week', -1).getDate()).toBe(14);
    });
});

describe('nowLineFraction', () => {
    it('is null before and after the day', () => {
        const dayStart = startOfDay(new Date(2026, 9, 21));
        expect(nowLineFraction(dayStart, dayStart.getTime() - 1)).toBeNull();
        expect(nowLineFraction(dayStart, dayStart.getTime() + dayLengthMs(dayStart))).toBeNull();
    });

    it('is the fraction of the day elapsed', () => {
        const dayStart = startOfDay(new Date(2026, 9, 21));
        const noon = dayStart.getTime() + (12 * 60 * 60 * 1000);
        expect(nowLineFraction(dayStart, noon)).toBeCloseTo(0.5, 5);
    });
});

describe('eventFraction', () => {
    it('clips to the day', () => {
        const dayStart = startOfDay(new Date(2026, 9, 21));
        const {top, height} = eventFraction({start: dayStart.getTime() - 1000, end: dayStart.getTime() + (60 * 60 * 1000)}, dayStart);
        expect(top).toBe(0);
        expect(height).toBeCloseTo(1 / 24, 5);
    });
});

describe('layoutDayEvents', () => {
    const dayStart = startOfDay(new Date(2026, 9, 21));
    const at = (hour: number, minutes = 0) => dayStart.getTime() + (hour * 60 * 60 * 1000) + (minutes * 60 * 1000);

    it('gives a single event its own column', () => {
        const layout = layoutDayEvents([{start: at(9), end: at(10)}], dayStart);
        expect(layout).toHaveLength(1);
        expect(layout[0].column).toBe(0);
        expect(layout[0].columns).toBe(1);
    });

    it('places two overlapping events side by side', () => {
        const a = {start: at(9), end: at(10)};
        const b = {start: at(9, 30), end: at(10, 30)};
        const layout = layoutDayEvents([a, b], dayStart);
        expect(layout).toHaveLength(2);
        expect(layout.every((l) => l.columns === 2)).toBe(true);
        expect(new Set(layout.map((l) => l.column))).toEqual(new Set([0, 1]));
    });

    it('does not widen a cluster for events elsewhere in the day', () => {
        const a = {start: at(9), end: at(10)};
        const b = {start: at(9, 30), end: at(10, 30)};
        const c = {start: at(14), end: at(15)};
        const layout = layoutDayEvents([a, b, c], dayStart);
        const cLayout = layout.find((l) => l.item === c);
        expect(cLayout?.columns).toBe(1);
    });

    it('reuses a column once its event has ended', () => {
        const a = {start: at(9), end: at(10)};
        const b = {start: at(10), end: at(11)};
        const layout = layoutDayEvents([a, b], dayStart);
        expect(layout.every((l) => l.columns === 1)).toBe(true);
    });
});

describe('DST safety', () => {
    const originalTz = process.env.TZ;

    afterEach(() => {
        process.env.TZ = originalTz;
    });

    it('a US spring-forward day is 23 hours', () => {
        process.env.TZ = 'America/New_York';
        // 2026-03-08 is the US spring-forward date (clocks skip 02:00-03:00).
        const dayStart = startOfDay(new Date(2026, 2, 8));
        expect(dayLengthMs(dayStart)).toBe(23 * 60 * 60 * 1000);
    });

    it('a US fall-back day is 25 hours', () => {
        process.env.TZ = 'America/New_York';
        // 2026-11-01 is the US fall-back date (01:00-02:00 happens twice).
        const dayStart = startOfDay(new Date(2026, 10, 1));
        expect(dayLengthMs(dayStart)).toBe(25 * 60 * 60 * 1000);
    });

    it('positions an event after the spring-forward gap by elapsed time, not wall-clock hours', () => {
        process.env.TZ = 'America/New_York';
        const dayStart = startOfDay(new Date(2026, 2, 8));
        // 04:00 local, after the skipped hour: only 3 wall-clock hours have been on the
        // clock, but 4 real hours have elapsed since midnight.
        const fourAm = new Date(2026, 2, 8, 4, 0, 0).getTime();
        const {top} = eventFraction({start: fourAm, end: fourAm + 1000}, dayStart);
        expect(top).toBeCloseTo(4 / 23, 5);
    });
});
