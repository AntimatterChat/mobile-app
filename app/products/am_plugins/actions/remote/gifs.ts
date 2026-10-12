// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {forceLogoutIfNecessary} from '@actions/remote/session';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import type {GifItem, GifKind, GifPage, GifsConfig} from '../../types';

// fetchGifsConfig tells whether the GIF service is set up, and whether it offers stickers.
export async function fetchGifsConfig(serverUrl: string): Promise<{config?: GifsConfig; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        return {config: await client.getGifsConfig()};
    } catch (error) {
        logDebug('error on fetchGifsConfig', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// fetchGifs returns a page of GIFs or stickers: those matching a search, else the featured ones.
export async function fetchGifs(serverUrl: string, kind: GifKind, query: string, pos?: string): Promise<{page?: GifPage; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const q = query.trim();
        const page = q ? await client.searchGifs(kind, q, pos) : await client.getFeaturedGifs(kind, pos);
        return {page: {items: page?.items ?? [], next: page?.next}};
    } catch (error) {
        logDebug('error on fetchGifs', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// postGif sends a GIF or sticker to a channel or thread: the plugin posts it as the user.
export async function postGif(serverUrl: string, item: GifItem, channelId: string, rootId?: string, query?: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        await client.postGif(item, channelId, rootId, query);
        return {data: true};
    } catch (error) {
        logDebug('error on postGif', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
