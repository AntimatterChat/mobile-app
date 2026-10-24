// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useState} from 'react';

import {storeGlobal} from '@actions/app/global';
import {GLOBAL_IDENTIFIERS} from '@constants/database';
import {queryGlobalValue} from '@queries/app/global';

export type UpcomingCallsView = 'schedule' | 'day' | 'week';

const VALID_VIEWS: UpcomingCallsView[] = ['schedule', 'day', 'week'];

// useUpcomingCallsView is the Schedule | Day | Week segmented switch: remembered per
// device (the app's own local Global table, not synced to the server), defaulting to
// Schedule.
export function useUpcomingCallsView(): [UpcomingCallsView, (view: UpcomingCallsView) => void] {
    const [view, setViewState] = useState<UpcomingCallsView>('schedule');

    useEffect(() => {
        let mounted = true;
        (async () => {
            const records = await queryGlobalValue(GLOBAL_IDENTIFIERS.CALENDAR_UPCOMING_CALLS_VIEW)?.fetch();
            const stored = records?.[0]?.value;
            if (mounted && VALID_VIEWS.includes(stored)) {
                setViewState(stored);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const setView = useCallback((next: UpcomingCallsView) => {
        setViewState(next);
        storeGlobal(GLOBAL_IDENTIFIERS.CALENDAR_UPCOMING_CALLS_VIEW, next);
    }, []);

    return [view, setView];
}
