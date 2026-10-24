// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {extractDataPoints} from './sparkline_data';

describe('extractDataPoints', () => {
    it('reads a well-formed points line', () => {
        const result = 'www-1 CPU, last hour: 23% average, 61% peak at 14:05\n  points: 1792846800:12.5, 1792847100:18.2, 1792847400:61\n';
        expect(extractDataPoints(result)).toEqual([12.5, 18.2, 61]);
    });

    it('reads only the first series when several points lines are present', () => {
        const result = '  points: 1:1, 2:2, 3:3\n  points: 1:100, 2:200, 3:300\n';
        expect(extractDataPoints(result)).toEqual([1, 2, 3]);
    });

    it('is case-insensitive and tolerates extra spacing', () => {
        const result = 'Points:   1:5,   2:6   ,3:7';
        expect(extractDataPoints(result)).toEqual([5, 6, 7]);
    });

    it('returns null without a result', () => {
        expect(extractDataPoints(undefined)).toBeNull();
    });

    it('returns null when the result has no points line', () => {
        expect(extractDataPoints('www-1 CPU, last hour: 23% average')).toBeNull();
    });

    it('returns null when the points line has fewer than two usable values', () => {
        expect(extractDataPoints('points: 1:5')).toBeNull();
    });

    it('returns null when the points line is entirely malformed', () => {
        expect(extractDataPoints('points: not, a, series')).toBeNull();
    });

    it('drops individual malformed pairs but keeps the rest', () => {
        const result = 'points: 1:5, garbage, 3:7';
        expect(extractDataPoints(result)).toEqual([5, 7]);
    });
});
