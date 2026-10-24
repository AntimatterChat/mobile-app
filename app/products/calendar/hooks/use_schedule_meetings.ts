// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {useServerUrl} from '@context/server';

import {fetchCommunityMeetings} from '../actions/remote/meetings';
import {calendarStore} from '../store';
import {UPCOMING_CALLS_PAGE_DAYS} from '../constants';

import type {MeetingOccurrence} from '../types/calendar';

const PAGE_MS = UPCOMING_CALLS_PAGE_DAYS * 24 * 60 * 60 * 1000;

// useScheduleMeetings is the Schedule screen's data: the community's calls starting from
// now, 30 days at a time (GET /meetings never takes more than a 100-day range, so paging
// requests non-overlapping 30-day windows and appends, rather than widening one request).
export function useScheduleMeetings(teamId: string | undefined) {
    const serverUrl = useServerUrl();
    const [occurrences, setOccurrences] = useState<MeetingOccurrence[]>([]);
    const [loading, setLoading] = useState(false);
    const fromRef = useRef(Date.now());
    const pageRef = useRef(0);
    const loadingRef = useRef(false);

    const loadMore = useCallback(async () => {
        if (!teamId || loadingRef.current) {
            return;
        }
        loadingRef.current = true;
        setLoading(true);
        const page = pageRef.current;
        const from = fromRef.current + (page * PAGE_MS);
        const to = from + PAGE_MS;
        const result = await fetchCommunityMeetings(serverUrl, teamId, from, to);
        setLoading(false);
        loadingRef.current = false;
        if (result.data) {
            pageRef.current = page + 1;
            setOccurrences((prev) => (page === 0 ? result.data!.occurrences : [...prev, ...result.data!.occurrences]));
        }
    }, [serverUrl, teamId]);

    const refresh = useCallback(() => {
        fromRef.current = Date.now();
        pageRef.current = 0;
        setOccurrences([]);
        loadMore();
    }, [loadMore]);

    useEffect(() => {
        refresh();

        // refresh depends only on teamId through loadMore; re-running it for every render
        // of loadMore would reset paging state on each load, so this effect is keyed on
        // teamId alone.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [teamId]);

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

    return {occurrences, loading, refresh, loadMore};
}
