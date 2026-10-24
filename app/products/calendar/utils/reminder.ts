// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {defineMessages, type IntlShape} from 'react-intl';

import {DEFAULT_REMINDER_MINUTES, REMINDER_MINUTES, type ReminderMinutes} from '../constants';

// Labels for the fixed reminder choices (none, at start, 5/10/15/30 min, 1 hour, 1 day), as
// the Calendar app's server defines them, plus "Default" for a member's own override.

export const reminderMessages = defineMessages({
    none: {id: 'calendar.reminder.none', defaultMessage: 'None'},
    atStart: {id: 'calendar.reminder.at_start', defaultMessage: 'At start'},
    minutes: {id: 'calendar.reminder.minutes', defaultMessage: '{n} minutes before'},
    hour: {id: 'calendar.reminder.hour', defaultMessage: '1 hour before'},
    day: {id: 'calendar.reminder.day', defaultMessage: '1 day before'},
    default: {id: 'calendar.reminder.default', defaultMessage: 'Default ({minutes})'},
});

export function describeReminderMinutes(minutes: ReminderMinutes, intl: IntlShape): string {
    switch (minutes) {
        case -1:
            return intl.formatMessage(reminderMessages.none);
        case 0:
            return intl.formatMessage(reminderMessages.atStart);
        case 60:
            return intl.formatMessage(reminderMessages.hour);
        case 1440:
            return intl.formatMessage(reminderMessages.day);
        default:
            return intl.formatMessage(reminderMessages.minutes, {n: minutes});
    }
}

export type ReminderChoice = {
    minutes: ReminderMinutes | null;
    label: string;
};

// The choices for a member's own override: the fixed list, plus "Default" (the call's own
// reminder, shown in parentheses), mapping to `null` in the request.
export function reminderChoicesWithDefault(callReminderMinutes: ReminderMinutes, intl: IntlShape): ReminderChoice[] {
    const defaultLabel = intl.formatMessage(reminderMessages.default, {minutes: describeReminderMinutes(callReminderMinutes, intl)});
    return [
        {minutes: null, label: defaultLabel},
        ...REMINDER_MINUTES.map((minutes) => ({minutes, label: describeReminderMinutes(minutes, intl)})),
    ];
}

// The choices for the call's own reminder (the organiser's edit form): the fixed list only.
export function reminderChoices(intl: IntlShape): ReminderChoice[] {
    return REMINDER_MINUTES.map((minutes) => ({minutes, label: describeReminderMinutes(minutes, intl)}));
}

export {DEFAULT_REMINDER_MINUTES};
