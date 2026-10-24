// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useState} from 'react';

import {useServerUrl} from '@context/server';

import {fetchCommunityMeetings} from '../actions/remote/meetings';
import {MEETING_REFRESH_MIN_INTERVAL_MS} from '../constants';
import {calendarStore} from '../store';
import {hasLiveOccurrence} from '../utils/live';

// No call lasts more than this (the server's own limit), so a window this wide back from
// now can't miss one that's running.
const MAX_CALL_DURATION_MS = 24 * 60 * 60 * 1000;

// useAnyMeetingLive is the "Upcoming calls" entry's live dot: whether any of the
// community's calls is running right now, read with the same GET /meetings the Schedule
// screen uses (never filtered client-side for privacy — only this derived, non-identifying
// boolean is kept).
export function useAnyMeetingLive(teamId: string | undefined, enabled: boolean) {
    const serverUrl = useServerUrl();
    const [live, setLive] = useState(false);

    const refresh = useCallback(async () => {
        if (!teamId || !enabled) {
            setLive(false);
            return;
        }
        const now = Date.now();
        const result = await fetchCommunityMeetings(serverUrl, teamId, now - MAX_CALL_DURATION_MS, now + 1);
        if (result.data) {
            setLive(hasLiveOccurrence(result.data.occurrences, now));
        }
    }, [serverUrl, teamId, enabled]);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, MEETING_REFRESH_MIN_INTERVAL_MS);
        return () => clearInterval(id);
    }, [refresh]);

    useEffect(() => {
        const sub = calendarStore.observeChanged(serverUrl).subscribe(() => refresh());
        return () => sub.unsubscribe();
    }, [serverUrl, refresh]);

    return live;
}
