// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {useServerUrl} from '@context/server';

import {fetchCommunityMeetings} from '../actions/remote/meetings';
import {calendarStore} from '../store';

import type {MeetingOccurrence} from '../types/calendar';

// useMeetingsRange reads the community's occurrences for [from, to) (GET /meetings), for
// the Day and Week screens (and the Schedule screen's own paging hook below). Refreshes on
// meeting_changed, on screen focus (the caller calls `refresh` from useFocusEffect) and on
// app foreground. Never filters what comes back: the server already decided what the
// caller may see.
export function useMeetingsRange(teamId: string | undefined, from: number, to: number) {
    const serverUrl = useServerUrl();
    const [occurrences, setOccurrences] = useState<MeetingOccurrence[]>([]);
    const [loading, setLoading] = useState(false);
    const rangeRef = useRef({from, to});
    rangeRef.current = {from, to};

    const refresh = useCallback(async () => {
        if (!teamId) {
            return;
        }
        setLoading(true);
        const result = await fetchCommunityMeetings(serverUrl, teamId, rangeRef.current.from, rangeRef.current.to);
        setLoading(false);
        if (result.data) {
            setOccurrences(result.data.occurrences);
        }
    }, [serverUrl, teamId]);

    useEffect(() => {
        refresh();
    }, [refresh, from, to]);

    useEffect(() => {
        const sub = calendarStore.observeChanged(serverUrl).subscribe(() => refresh());
        return () => sub.unsubscribe();
    }, [serverUrl, refresh]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                refresh();
            }
        });
        return () => sub.remove();
    }, [refresh]);

    return {occurrences, loading, refresh};
}
