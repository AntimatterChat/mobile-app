// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// A spoiler is a message whose text and files stay hidden until its reader chooses to see them, as in Discord. The
// Antimatter server marks it with the spoiler prop, and leaves its text out of notifications and inline-reply quotes.
export const SPOILER_PROP = 'spoiler';

type WithProps = {props?: Record<string, unknown> | null};

export function isSpoilerPost(post?: WithProps | null): boolean {
    const value = post?.props?.[SPOILER_PROP];
    return value === true || value === 'true';
}

// The spoilers shown stay shown for the session, also when their message is drawn again: scrolled back to, opened in
// a thread, or found in search results.
const shown = new Set<string>();
const listeners = new Set<() => void>();

export function subscribeToSpoilers(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function isSpoilerShown(postId: string) {
    return shown.has(postId);
}

export function setSpoilerShown(postId: string, show: boolean) {
    if (show === shown.has(postId)) {
        return;
    }
    if (show) {
        shown.add(postId);
    } else {
        shown.delete(postId);
    }
    listeners.forEach((listener) => listener());
}
