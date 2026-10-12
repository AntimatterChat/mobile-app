// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {findTimestamps, formatTimestamp, formatTimestampsInText} from './dynamic_timestamp';

// Tuesday, November 14 2023, 22:13:20 UTC.
const SECONDS = 1700000000;
const options = {locale: 'en-US', timeZone: 'UTC', hour12: true};
const plain = (text: string) => text.replace(/\s/g, ' ');

describe('dynamic timestamps', () => {
    test.each([
        ['t', '10:13 PM'],
        ['T', '10:13:20 PM'],
        ['d', '11/14/23'],
        ['D', 'November 14, 2023'],
        ['f', 'November 14, 2023 at 10:13 PM'],
        ['F', 'Tuesday, November 14, 2023 at 10:13 PM'],
    ])('should show the %s style', (style, shown) => {
        expect(plain(formatTimestamp(SECONDS, style, options))).toBe(shown);
    });

    it('should show them in the reader\'s time zone and clock', () => {
        expect(plain(formatTimestamp(SECONDS, 't', {locale: 'en-US', timeZone: 'Asia/Tokyo', hour12: false}))).toBe('07:13');
    });

    it('should show relative times', () => {
        const now = SECONDS * 1000;
        expect(formatTimestamp(SECONDS + (3 * 3600), 'R', {locale: 'en-US', now})).toBe('in 3 hours');
        expect(formatTimestamp(SECONDS - 86400, 'R', {locale: 'en-US', now})).toBe('yesterday');
    });

    it('should show what isn\'t a date as nothing', () => {
        expect(formatTimestamp(9e15, 'f', options)).toBe('');
    });

    it('should find the timestamps of a text', () => {
        expect(findTimestamps('From <t:1700000000:R> to <t:1700003600>, not <t:x>')).toEqual([
            {index: 5, text: '<t:1700000000:R>', seconds: 1700000000, style: 'R'},
            {index: 25, text: '<t:1700003600>', seconds: 1700003600, style: 'f'},
        ]);
    });

    it('should show the timestamps of a plain text', () => {
        expect(plain(formatTimestampsInText('Freeze on <t:1700000000:D>.', options))).toBe('Freeze on November 14, 2023.');
    });
});
