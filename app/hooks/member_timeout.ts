// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useState, useSyncExternalStore} from 'react';

import {fetchMyTeamTimeout} from '@actions/remote/member_timeout';
import MemberTimeoutStore from '@store/member_timeout_store';

// How long a team's timeouts are trusted without the server telling of a change.
const STALE = 5 * 60 * 1000;

// setTimeout takes at most this many milliseconds.
const MAX_DELAY = (2 ** 31) - 1;

// useMyTeamTimeout says until when the current user is timed out of a team (Antimatter moderation), or 0, loading it
// when it isn't known and changing back to 0 when it ends.
export function useMyTeamTimeout(serverUrl: string, teamId?: string): number {
    const getSnapshot = useCallback(() => (teamId ? MemberTimeoutStore.getUntil(serverUrl, teamId) : 0), [serverUrl, teamId]);
    const until = useSyncExternalStore(MemberTimeoutStore.subscribe, getSnapshot);
    const [, setNow] = useState(Date.now);
    const tick = useCallback(() => setNow(Date.now()), []);

    useEffect(() => {
        if (teamId && Date.now() - MemberTimeoutStore.getLoadedAt(serverUrl, teamId) > STALE) {
            fetchMyTeamTimeout(serverUrl, teamId);
        }
    }, [serverUrl, teamId]);

    useEffect(() => {
        const left = until - Date.now();
        if (left <= 0) {
            return undefined;
        }
        const timer = setTimeout(tick, Math.min(left + 500, MAX_DELAY));
        return () => clearTimeout(timer);
    }, [until, tick]);

    return until > Date.now() ? until : 0;
}
