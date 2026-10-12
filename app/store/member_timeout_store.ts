// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The current user's timeouts (Antimatter moderation), by server and team: until when they can read the team's
// channels but not post or react in them, as last fetched.
type Entry = {until: number; loadedAt: number};

const timeouts = new Map<string, Entry>();
const listeners = new Set<() => void>();

const key = (serverUrl: string, teamId: string) => `${serverUrl}|${teamId}`;

const MemberTimeoutStore = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    // getUntil is when the current user's timeout from a team ends, or 0.
    getUntil(serverUrl: string, teamId: string) {
        return timeouts.get(key(serverUrl, teamId))?.until ?? 0;
    },

    getLoadedAt(serverUrl: string, teamId: string) {
        return timeouts.get(key(serverUrl, teamId))?.loadedAt ?? 0;
    },

    setUntil(serverUrl: string, teamId: string, until: number) {
        const previous = timeouts.get(key(serverUrl, teamId));
        timeouts.set(key(serverUrl, teamId), {until, loadedAt: Date.now()});
        if (previous?.until !== until) {
            listeners.forEach((listener) => listener());
        }
    },

    clear() {
        timeouts.clear();
        listeners.forEach((listener) => listener());
    },
};

export default MemberTimeoutStore;
