// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {addDays, startOfDay} from './grid';

import type {MeetingOccurrence} from '../types/calendar';

export type ScheduleGroupLabel = 'today' | 'tomorrow' | 'date';

export type ScheduleGroup = {
    key: string;
    label: ScheduleGroupLabel;
    date: Date;
    occurrences: MeetingOccurrence[];
};

// groupOccurrencesByDay buckets the Schedule screen's occurrences by Today, Tomorrow and
// then by date, in the device's own timezone, each bucket sorted by start time.
export function groupOccurrencesByDay(occurrences: MeetingOccurrence[], now: Date): ScheduleGroup[] {
    const todayStart = startOfDay(now).getTime();
    const tomorrowStart = addDays(startOfDay(now), 1).getTime();

    const byDay = new Map<number, MeetingOccurrence[]>();
    for (const occurrence of occurrences) {
        const dayStart = startOfDay(new Date(occurrence.start)).getTime();
        const bucket = byDay.get(dayStart);
        if (bucket) {
            bucket.push(occurrence);
        } else {
            byDay.set(dayStart, [occurrence]);
        }
    }

    return Array.from(byDay.keys()).
        sort((a, b) => a - b).
        map((dayStart) => {
            let label: ScheduleGroupLabel = 'date';
            if (dayStart === todayStart) {
                label = 'today';
            } else if (dayStart === tomorrowStart) {
                label = 'tomorrow';
            }
            const dayOccurrences = (byDay.get(dayStart) as MeetingOccurrence[]).
                slice().
                sort((a, b) => a.start - b.start);
            return {key: String(dayStart), label, date: new Date(dayStart), occurrences: dayOccurrences};
        });
}
