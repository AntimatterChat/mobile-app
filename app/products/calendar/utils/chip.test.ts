// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {computeChipPhase, describeChip, minutesUntil} from './chip';

import type {NextMeeting} from '../types/calendar';

const intl = createIntl({locale: 'en'});

const next = (overrides: Partial<NextMeeting> = {}): NextMeeting => ({
    meeting_id: 'm1',
    post_id: 'p1',
    summary: 'Weekly sync',
    start: Date.UTC(2026, 11, 15, 14, 0, 0),
    end: Date.UTC(2026, 11, 15, 14, 30, 0),
    live: false,
    recurring: false,
    ...overrides,
});

describe('computeChipPhase', () => {
    it('is upcoming more than an hour before start', () => {
        const n = next();
        expect(computeChipPhase(n, n.start - (2 * 60 * 60 * 1000))).toBe('upcoming');
    });

    it('is soon within the last hour before start', () => {
        const n = next();
        expect(computeChipPhase(n, n.start - (30 * 60 * 1000))).toBe('soon');
    });

    it('is soon exactly at the one-hour boundary', () => {
        const n = next();
        expect(computeChipPhase(n, n.start - (60 * 60 * 1000))).toBe('soon');
    });

    it('is live while start <= now < end', () => {
        const n = next();
        expect(computeChipPhase(n, n.start)).toBe('live');
        expect(computeChipPhase(n, n.end - 1)).toBe('live');
    });

    it('is live when the server already says so', () => {
        const n = next({live: true, start: Date.now() + 1000});
        expect(computeChipPhase(n, Date.now())).toBe('live');
    });

    it('is not live once end has passed', () => {
        const n = next();
        expect(computeChipPhase(n, n.end)).not.toBe('live');
    });
});

describe('minutesUntil', () => {
    it('rounds up and never goes negative', () => {
        expect(minutesUntil(1000 * 90, 0)).toBe(2);
        expect(minutesUntil(0, 1000)).toBe(0);
    });
});

describe('describeChip', () => {
    it('shows the weekday, time and title when upcoming', () => {
        const n = next();
        const {phase, label} = describeChip(n, n.start - (3 * 60 * 60 * 1000), intl);
        expect(phase).toBe('upcoming');
        expect(label).toContain('Next call:');
        expect(label).toContain('Weekly sync');
    });

    it('shows minutes left when soon', () => {
        const n = next();
        const {phase, label} = describeChip(n, n.start - (10 * 60 * 1000), intl);
        expect(phase).toBe('soon');
        expect(label).toContain('10 min');
        expect(label).toContain('Weekly sync');
    });

    it('shows Live when running', () => {
        const n = next();
        const {phase, label} = describeChip(n, n.start, intl);
        expect(phase).toBe('live');
        expect(label).toBe('Live · Weekly sync');
    });
});
