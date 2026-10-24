// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {MeetingOccurrence} from '../types/calendar';

// hasLiveOccurrence tells whether any of the community's occurrences is running right now
// (the "Upcoming calls" entry's live dot). Pure so the edge (an occurrence ending exactly
// now) is simple to test.
export function hasLiveOccurrence(occurrences: MeetingOccurrence[], now: number): boolean {
    return occurrences.some((o) => o.start <= now && now < o.end);
}
