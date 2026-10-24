// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useDatabase} from '@nozbe/watermelondb/react';
import {useEffect, useRef} from 'react';

import {fetchFocus, fetchFocusSummary, markFocusSummarySeen} from '@actions/remote/focus';
import {Screens} from '@constants';
import {FOCUS_PREF_CATEGORY, FOCUS_PREF_SEEN} from '@constants/focus';
import {SNACK_BAR_TYPE} from '@constants/snack_bar';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {navigateToScreen} from '@screens/navigation';
import FocusStore from '@store/focus_store';
import {showSnackBar} from '@utils/snack_bar';

import type {Database} from '@nozbe/watermelondb';
import type {AppStateStatus} from 'react-native';

// alreadySeen tells whether the focus that started at startAt has already had its summary seen (on this device or
// another), from the focus/summary_seen preference.
async function alreadySeen(database: Database, startAt: number): Promise<boolean> {
    const seen = await queryPreferencesByCategoryAndName(database, FOCUS_PREF_CATEGORY, FOCUS_PREF_SEEN).fetch();
    return seen[0]?.value === String(startAt);
}

// showFocusSummary opens the summary of what was missed, unless nothing came in, in which case it's marked seen
// straight away with a toast instead.
async function showFocusSummary(serverUrl: string, database: Database, window: FocusWindow) {
    if (await alreadySeen(database, window.start_at)) {
        FocusStore.setFocusSummaryWindow(serverUrl, null);
        return;
    }

    const {summary} = await fetchFocusSummary(serverUrl, window.start_at, window.end_at);
    if (!summary || (!summary.channels.length && !summary.threads.length)) {
        showSnackBar({barType: SNACK_BAR_TYPE.FOCUS_ENDED_NOTHING});
        await markFocusSummarySeen(serverUrl, window.start_at);
        return;
    }

    navigateToScreen(Screens.FOCUS_SUMMARY, {startAt: window.start_at, endAt: window.end_at});
}

// useFocusSummaryEffect shows, once, what the user missed when one of their focuses ends: told by the server
// (focus_ended, on any of their devices, via the websocket handler), or found here on becoming active (a focus may
// have ended while the app was away or on another device).
export function useFocusSummaryEffect(serverUrl: string, appState: AppStateStatus) {
    const database = useDatabase();
    const shown = useRef<number>(0);

    useEffect(() => {
        if (appState !== 'active' || !database) {
            return;
        }
        (async () => {
            const {state} = await fetchFocus(serverUrl);
            if (state && !state.active && state.ended_at > 0 && !(await alreadySeen(database, state.start_at))) {
                FocusStore.setFocusSummaryWindow(serverUrl, {start_at: state.start_at, end_at: state.ended_at});
            }
        })();
    }, [serverUrl, database, appState]);

    useEffect(() => {
        if (!database) {
            return undefined;
        }
        const subscription = FocusStore.observe(serverUrl).subscribe((window) => {
            if (window && window.start_at !== shown.current) {
                shown.current = window.start_at;
                showFocusSummary(serverUrl, database, window);
            }
        });
        return () => subscription.unsubscribe();
    }, [serverUrl, database]);
}
