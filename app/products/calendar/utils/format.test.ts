// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {formatMeetingTime, formatMeetingTimeRange} from './format';

const intl = createIntl({locale: 'en'});

describe('formatMeetingTimeRange', () => {
    it('shows the weekday, date and start-end time', () => {
        const start = new Date(2026, 11, 15, 14, 0, 0).getTime();
        const end = new Date(2026, 11, 15, 14, 30, 0).getTime();
        const result = formatMeetingTimeRange(start, end, intl);
        expect(result).toContain('Dec 15');
        expect(result).toContain('2:00');
        expect(result).toContain('2:30');
    });
});

describe('formatMeetingTime', () => {
    it('shows just the start time', () => {
        const start = new Date(2026, 11, 15, 9, 5, 0).getTime();
        expect(formatMeetingTime(start, intl)).toContain('9:05');
    });
});
