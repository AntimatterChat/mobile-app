// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createIntl} from 'react-intl';

import {describeReminderMinutes, reminderChoices, reminderChoicesWithDefault} from './reminder';

const intl = createIntl({locale: 'en'});

describe('describeReminderMinutes', () => {
    it.each([
        [-1, 'None'],
        [0, 'At start'],
        [60, '1 hour before'],
        [1440, '1 day before'],
    ])('describes %s as %s', (minutes, label) => {
        expect(describeReminderMinutes(minutes as never, intl)).toBe(label);
    });

    it('describes a minute count', () => {
        expect(describeReminderMinutes(10, intl)).toBe('10 minutes before');
    });
});

describe('reminderChoices', () => {
    it('lists the 8 fixed choices and nothing else', () => {
        const choices = reminderChoices(intl);
        expect(choices).toHaveLength(8);
        expect(choices.map((c) => c.minutes)).toEqual([-1, 0, 5, 10, 15, 30, 60, 1440]);
    });
});

describe('reminderChoicesWithDefault', () => {
    it('adds Default, mapping to null, ahead of the fixed list', () => {
        const choices = reminderChoicesWithDefault(10, intl);
        expect(choices).toHaveLength(9);
        expect(choices[0].minutes).toBeNull();
        expect(choices[0].label).toContain('10 minutes before');
    });
});
