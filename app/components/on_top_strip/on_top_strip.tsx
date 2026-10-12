// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useIntl} from 'react-intl';

import {fetchOnTopPosts, removePostFromTop} from '@actions/remote/on_top';
import {fetchPostById} from '@actions/remote/post';
import {SNACK_BAR_TYPE} from '@constants/snack_bar';
import {useServerUrl} from '@context/server';
import DatabaseManager from '@database/manager';
import {getPostById} from '@queries/servers/post';
import {getFullErrorMessage} from '@utils/errors';
import {activeOnTop, nextExpiry, onTopMessages} from '@utils/on_top';
import {showSnackBar} from '@utils/snack_bar';

import OnTopBanner from './on_top_banner';

// How often the time left is shown again.
const TICK_MS = 30000;
const MAX_TIMER_MS = 2147483647;

// useNow is the time, again every half minute, and when a deadline comes (the next expiry), so that
// what's shown follows the clock.
export function useNow(deadline?: number): number {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), TICK_MS);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        // Timers can't wait longer than about 24 days; the half-minute ticks get there.
        if (!deadline || deadline - Date.now() > MAX_TIMER_MS) {
            return undefined;
        }

        // A little after the deadline, so that the expired message is surely left out.
        const timer = setTimeout(() => setNow(Date.now()), Math.max(0, deadline - Date.now()) + 250);
        return () => clearTimeout(timer);
    }, [deadline]);
    return now;
}

// loadPostNotStored fetches a message the database doesn't hold: undefined when it holds it, null
// when it can't be loaded (or was deleted).
async function loadPostNotStored(serverUrl: string, postId: string): Promise<Post | null | undefined> {
    const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
    if (await getPostById(database, postId)) {
        return undefined;
    }
    const {post} = await fetchPostById(serverUrl, postId, true);
    return post && !post.delete_at ? post : null;
}

type Props = {
    channelId: string;
    list?: OnTopPost[];
    canRemove: boolean;
    currentUserId: string;
    isTopItem: boolean;
};

// OnTopStrip shows the messages put on top of a channel above its messages: one at a time, the
// latest put there first, with previous/next between them, its author, who put it there and for how
// long still, its first lines, a jump to it and a button taking it off the top, as in the Fusion
// web UI.
const OnTopStrip = ({channelId, list, canRemove, currentUserId, isTopItem}: Props) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();
    const [index, setIndex] = useState(0);
    const [unavailable, setUnavailable] = useState<Set<string>>(() => new Set());
    const now = useNow(list ? nextExpiry(list, Date.now()) : undefined);

    // What's on top is loaded on opening the channel; the websocket keeps it up to date.
    useEffect(() => {
        fetchOnTopPosts(serverUrl, channelId);
        setIndex(0);
    }, [serverUrl, channelId]);

    // The messages on top that aren't in the database are fetched, once, without storing them
    // (they'd show in the channel's list out of place); those that can't be are left out.
    const [fetched, setFetched] = useState<Record<string, Post>>({});
    const asked = useRef(new Set<string>());
    const onLoaded = useCallback((id: string, post: Post | null | undefined) => {
        if (post) {
            setFetched((current) => ({...current, [id]: post}));
        } else if (post === null) {
            setUnavailable((current) => new Set(current).add(id));
        }
    }, []);
    useEffect(() => {
        const ids = activeOnTop(list || [], Date.now()).map((o) => o.post_id).filter((id) => !asked.current.has(id));
        for (const id of ids) {
            asked.current.add(id);
            loadPostNotStored(serverUrl, id).then((post) => onLoaded(id, post));
        }
    }, [list, serverUrl, onLoaded]);

    // A message just put on top shows first.
    const latest = list?.[0] ? `${list[0].post_id}:${list[0].create_at}` : '';
    useEffect(() => {
        setIndex(0);
    }, [latest]);

    const shown = useMemo(() => activeOnTop(list || [], now).filter((o) => !unavailable.has(o.post_id)), [list, now, unavailable]);

    const current = Math.min(index, Math.max(0, shown.length - 1));
    const entry = shown[current];
    const count = shown.length;

    const go = useCallback((step: number) => {
        if (count) {
            setIndex((current + step + count) % count);
        }
    }, [current, count]);

    const onRemove = useCallback(async () => {
        if (!entry) {
            return;
        }
        const result = await removePostFromTop(serverUrl, channelId, entry.post_id);
        showSnackBar({
            barType: SNACK_BAR_TYPE.PLUGIN_TOAST,
            customMessage: result.error ? getFullErrorMessage(result.error) || intl.formatMessage(onTopMessages.removeFailed) : intl.formatMessage(onTopMessages.removedToast),
            type: result.error ? 'error' : 'success',
        });
    }, [entry, serverUrl, channelId, intl]);

    const onMissing = useCallback((postId: string) => {
        setUnavailable((currentSet) => new Set(currentSet).add(postId));
    }, []);

    if (!entry) {
        return null;
    }

    return (
        <OnTopBanner
            canRemove={canRemove}
            count={count}
            currentUserId={currentUserId}
            entry={entry}
            fetchedPost={fetched[entry.post_id]}
            go={go}
            index={current}
            isTopItem={isTopItem}
            now={now}
            onMissing={onMissing}
            onRemove={onRemove}
            postId={entry.post_id}
        />
    );
};

export default OnTopStrip;
