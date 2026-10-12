// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useMemo} from 'react';

import {useServerUrl} from '@context/server';
import NetworkManager from '@managers/network_manager';

import {gifMediaUrl} from '../utils/gifs';

// useGifMediaSource returns the image or video source of a GIF's media: from the plugin's media
// route with the session, or from the GIF service. Invalid addresses give undefined.
export function useGifMediaSource(url: string | undefined) {
    const serverUrl = useServerUrl();
    return useMemo(() => {
        const src = gifMediaUrl(serverUrl, url);
        if (!src) {
            return undefined;
        }
        if (!src.needsAuth) {
            return {uri: src.uri};
        }
        try {
            return {uri: src.uri, headers: NetworkManager.getClient(serverUrl).getRequestHeaders('GET')};
        } catch {
            return {uri: src.uri};
        }
    }, [serverUrl, url]);
}
