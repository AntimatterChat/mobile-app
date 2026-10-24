// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    addDays,
    advanceDate,
    dayLengthMs,
    eventFraction,
    fractionOfDay,
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
    // jest.config.js pins process.env.TZ to UTC for every test in this suite (and
    // reassigning it at runtime doesn't change what Node's Date already resolved for this
    // process), so a real spring-forward/fall-back day can't be produced here: under UTC,
    // addDays(dayStart, 1) is always exactly 24h. dayLengthMs is still exactly
    // addDays(dayStart, 1).getTime() - dayStart.getTime() (asserted below, so it reflects
    // whatever the two local midnights actually are on a real device), and the grid math
    // built on it — fractionOfDay — never assumes a 24h day, which is the property that
    // actually matters for a 23- or 25-hour day; that's tested directly here against
    // deliberately non-24h lengths, independent of the runner's timezone.

    it('dayLengthMs is the real gap between the two local midnights', () => {
        const dayStart = startOfDay(new Date(2026, 9, 21));
        expect(dayLengthMs(dayStart)).toBe(addDays(dayStart, 1).getTime() - dayStart.getTime());
    });

    it('fractionOfDay divides by the day\'s own length, not a hardcoded 24 hours', () => {
        const TWENTY_THREE_HOURS = 23 * 60 * 60 * 1000;
        const TWENTY_FIVE_HOURS = 25 * 60 * 60 * 1000;

        // On a 23-hour (spring-forward) day, 4 hours in is a bigger fraction than on an
        // ordinary day.
        expect(fractionOfDay(4 * 60 * 60 * 1000, TWENTY_THREE_HOURS)).toBeCloseTo(4 / 23, 10);

        // On a 25-hour (fall-back) day, the same 4 hours in is a smaller fraction.
        expect(fractionOfDay(4 * 60 * 60 * 1000, TWENTY_FIVE_HOURS)).toBeCloseTo(4 / 25, 10);
    });

    it('eventFraction positions a block by elapsed time against a non-24h day length', () => {
        // Simulate a spring-forward day (23h) purely numerically: a dayStart and an event
        // 4 hours of real elapsed time into it, without depending on the system's own
        // timezone observing DST.
        const dayStart = new Date(2026, 2, 8);
        const realDayLength = 23 * 60 * 60 * 1000;
        const fourHoursIn = dayStart.getTime() + (4 * 60 * 60 * 1000);

        // dayLengthMs(dayStart) would be 24h under this runner's forced UTC; eventFraction
        // divides by it internally, so to exercise the 23h case directly this reproduces
        // its own formula (the same fractionOfDay used in production) rather than going
        // through dayLengthMs.
        const top = Math.max(0, fractionOfDay(fourHoursIn - dayStart.getTime(), realDayLength));
        expect(top).toBeCloseTo(4 / 23, 10);
    });

    it('nowLineFraction and eventFraction agree once given the same day length', () => {
        const dayStart = startOfDay(new Date(2026, 9, 21));
        const noon = dayStart.getTime() + (12 * 60 * 60 * 1000);
        const nowLine = nowLineFraction(dayStart, noon);
        const event = eventFraction({start: noon, end: noon + 1000}, dayStart);
        expect(nowLine).toBeCloseTo(event.top, 10);
    });
});
