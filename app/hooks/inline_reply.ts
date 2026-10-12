// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useSyncExternalStore} from 'react';

import {getInlineReply, setInlineReply, subscribeToInlineReplies} from '@utils/inline_reply';

// useInlineReply is the id of the message the composer of a channel (rootId '') or thread replies to, or '', and lets
// it reply to another message or to none.
export function useInlineReply(serverUrl: string, channelId: string, rootId: string): [string, (postId: string) => void] {
    const getSnapshot = useCallback(() => getInlineReply(serverUrl, channelId, rootId), [serverUrl, channelId, rootId]);
    const postId = useSyncExternalStore(subscribeToInlineReplies, getSnapshot);
    const setReply = useCallback((id: string) => setInlineReply(serverUrl, channelId, rootId, id), [serverUrl, channelId, rootId]);
    return [postId, setReply];
}
