// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, type AppStateStatus} from 'react-native';

import {useServerUrl} from '@context/server';

import {fetchNextChannelMeeting} from '../actions/remote/meetings';
import {MEETING_REFRESH_MIN_INTERVAL_MS} from '../constants';
import {calendarStore} from '../store';

import type {NextMeeting} from '../types/calendar';

// The UI ticks this often to flip the chip's state (the 7-day window, the last-hour "in N
// min", and "Live"). It never causes a network request by itself.
const TICK_MS = 15 * 1000;

// useNextMeeting is the channel header chip's data: the channel's next call (or none),
// refreshed on channel switch, on meeting_changed for this channel, on app foreground, and
// once the current occurrence's end passes — never more than once a minute, as
// .meetings_api_ref.md asks clients to.
export function useNextMeeting(channelId: string | undefined, enabled: boolean) {
    const serverUrl = useServerUrl();
    const [next, setNext] = useState<NextMeeting | null | undefined>(
        () => (channelId ? calendarStore.getNextMeeting(serverUrl, channelId) : undefined),
    );
    const [now, setNow] = useState(() => Date.now());
    const lastFetchRef = useRef(0);

    const refresh = useCallback((force = false) => {
        if (!channelId || !enabled) {
            return;
        }
        const sinceLast = Date.now() - lastFetchRef.current;
        if (!force && sinceLast < MEETING_REFRESH_MIN_INTERVAL_MS) {
            return;
        }
        lastFetchRef.current = Date.now();
        fetchNextChannelMeeting(serverUrl, channelId);
    }, [serverUrl, channelId, enabled]);

    // Channel switch: reset to the cached value (if any) and force a fresh read.
    useEffect(() => {
        if (!channelId || !enabled) {
            setNext(undefined);
            return undefined;
        }
        setNext(calendarStore.getNextMeeting(serverUrl, channelId));
        lastFetchRef.current = 0;
        refresh(true);

        const sub = calendarStore.observeNextMeeting(serverUrl, channelId).subscribe(setNext);
        return () => sub.unsubscribe();

        // refresh is stable for the same (serverUrl, channelId, enabled); this effect's own
        // job is the channel switch itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serverUrl, channelId, enabled]);

    // meeting_changed for this channel.
    useEffect(() => {
        if (!channelId || !enabled) {
            return undefined;
        }
        const sub = calendarStore.observeChanged(serverUrl).subscribe((signal) => {
            if (signal?.channelId === channelId) {
                refresh(true);
            }
        });
        return () => sub.unsubscribe();
    }, [serverUrl, channelId, enabled, refresh]);

    // App foreground: one of the three explicit triggers (with meeting_changed and the
    // channel switch), so it always reads again. Only the clock-driven re-check below
    // respects the one-minute floor.
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                refresh(true);
            }
        });
        return () => sub.remove();
    }, [enabled, refresh]);

    // The clock tick: flips the displayed phase, and re-reads once the shown occurrence ends.
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const id = setInterval(() => {
            setNow(Date.now());
        }, TICK_MS);
        return () => clearInterval(id);
    }, [enabled]);

    useEffect(() => {
        if (next && now >= next.end) {
            refresh();
        }
    }, [next, now, refresh]);

    return {next, now};
}
