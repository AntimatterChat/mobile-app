// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useCallback, useSyncExternalStore} from 'react';

import {isSpoilerShown, setSpoilerShown, subscribeToSpoilers} from '@utils/spoiler';

// useSpoilerShown tells whether the reader chose to see the spoiler of a post in this session, and lets them show it
// or hide it again.
export function useSpoilerShown(postId: string): [boolean, (show: boolean) => void] {
    const getSnapshot = useCallback(() => isSpoilerShown(postId), [postId]);
    const isShown = useSyncExternalStore(subscribeToSpoilers, getSnapshot);
    const setShown = useCallback((show: boolean) => setSpoilerShown(postId, show), [postId]);
    return [isShown, setShown];
}
