// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useState} from 'react';

import {fetchAssistantFeed} from '@assistant/actions/remote/feed';
import {assistantStore, EMPTY_FEED} from '@assistant/store';

// useAssistantFeed loads the person's feed for a channel (GET /feed) and then stays current
// from the store, which the three websocket events (assistant_card_added,
// assistant_card_updated, assistant_offer_updated) keep patched without a re-fetch.
export function useAssistantFeed(serverUrl: string, channelId: string | undefined) {
    const [feed, setFeed] = useState(() => (channelId ? assistantStore.getFeed(serverUrl, channelId) : EMPTY_FEED));

    useEffect(() => {
        if (!channelId) {
            return undefined;
        }

        setFeed(assistantStore.getFeed(serverUrl, channelId));
        fetchAssistantFeed(serverUrl, channelId);

        const sub = assistantStore.observeFeed(serverUrl, channelId).subscribe(setFeed);
        return () => sub.unsubscribe();
    }, [serverUrl, channelId]);

    return feed;
}
