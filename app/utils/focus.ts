// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment-timezone';
import {useEffect, useState} from 'react';
import {combineLatest, map, distinctUntilChanged} from 'rxjs';

import {FOCUS_UNTIL_PROP} from '@constants/focus';
import {General} from '@constants';
import {observeCurrentUser} from '@queries/servers/user';
import FocusStore from '@store/focus_store';

import type {Database} from '@nozbe/watermelondb';

// The longest a timer may wait (setTimeout's limit).
const MAX_TIMEOUT = (2 ** 31) - 1;

type FocusUser = {
    status?: string;
    props?: Record<string, unknown> | null;
} | undefined | null;

// focusUntil is the end of someone's focus from their user props, 0 when they don't focus (or the value isn't one).
export function focusUntil(user: FocusUser): number {
    const value = Number(user?.props?.[FOCUS_UNTIL_PROP] || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

// isFocusing tells whether someone currently focuses: Do not disturb, with the marker still ahead of now.
export function isFocusing(user: FocusUser): boolean {
    return user?.status === General.DND && focusUntil(user) > Date.now();
}

// useBefore tells whether the time given is still to come, rendering again when it comes (so a status dot updates
// without waiting for another change to the user record).
function useBefore(at: number): boolean {
    const [, tick] = useState(0);
    useEffect(() => {
        const left = at - Date.now();
        if (!at || left <= 0) {
            return undefined;
        }
        const timer = setTimeout(() => tick((n) => n + 1), Math.min(left + 50, MAX_TIMEOUT));
        return () => clearTimeout(timer);
    }, [at]);
    return at > Date.now();
}

// useMyFocusUntil is when your own focus ends, while you focus, else 0.
export function useMyFocusUntil(currentUser: FocusUser): number {
    const until = isFocusing(currentUser) ? focusUntil(currentUser) : 0;
    return useBefore(until) ? until : 0;
}

// useFocusSummaryWindow is the focus (if any) whose summary waits to be shown on this device.
export function useFocusSummaryWindow(serverUrl: string): FocusWindow | null {
    const [state, setState] = useState<FocusWindow | null>(() => FocusStore.getState(serverUrl));
    useEffect(() => {
        const subscription = FocusStore.observe(serverUrl).subscribe(setState);
        return () => subscription.unsubscribe();
    }, [serverUrl]);
    return state;
}

// useHideUnreads tells whether your own unread badges hide: while you focus, and after, until you leave the summary
// of what you missed. Unread state itself is kept; only its marks hide.
export function useHideUnreads(serverUrl: string, currentUser: FocusUser): boolean {
    const focusing = useMyFocusUntil(currentUser) > 0;
    const pending = useFocusSummaryWindow(serverUrl);
    return focusing || pending !== null;
}

// tomorrowAt9 is 09:00 tomorrow in the timezone given (the device's local time when none), as the server works it
// out for the "Until tomorrow" duration choice.
export function tomorrowAt9(zone: string, now = Date.now()): number {
    const base = zone ? moment.tz(now, zone) : moment(now);
    return base.add(1, 'day').set({hour: 9, minute: 0, second: 0, millisecond: 0}).valueOf();
}

// observeHideUnreads is useHideUnreads as an observable, for a WatermelonDB withObservables() pipeline that can't
// use hooks: the channel list and the servers' own unread badges.
export function observeHideUnreads(database: Database, serverUrl: string) {
    return combineLatest([observeCurrentUser(database), FocusStore.observe(serverUrl)]).pipe(
        map(([user, window]) => isFocusing(user) || window !== null),
        distinctUntilChanged(),
    );
}
