// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useDatabase} from '@nozbe/watermelondb/react';
import {useEffect, useState} from 'react';

import {expireTimedMutes} from '@actions/remote/timed_mute';
import {queryPreferencesByCategoryAndName} from '@queries/servers/preference';
import {CATEGORY_MUTE_UNTIL, muteEnd} from '@utils/timed_mute';

import type {AppStateStatus} from 'react-native';

const MINUTE = 60 * 1000;

// useMuteEnd says when a channel's timed mute ends, or 0.
export function useMuteEnd(channelId: string): number {
    const database = useDatabase();
    const [end, setEnd] = useState(0);
    useEffect(() => {
        const subscription = queryPreferencesByCategoryAndName(database, CATEGORY_MUTE_UNTIL, channelId).
            observeWithColumns(['value']).
            subscribe((prefs) => setEnd(muteEnd(prefs[0]?.value)));
        return () => subscription.unsubscribe();
    }, [database, channelId]);
    return end;
}

// useTimedMuteExpiry unmutes the channels whose timed mute is over while the app is in use: when it becomes active,
// then every minute, as Fusion does.
export function useTimedMuteExpiry(serverUrl: string, appState: AppStateStatus) {
    useEffect(() => {
        if (appState !== 'active') {
            return undefined;
        }
        expireTimedMutes(serverUrl);
        const interval = setInterval(() => expireTimedMutes(serverUrl), MINUTE);
        return () => clearInterval(interval);
    }, [serverUrl, appState]);
}
