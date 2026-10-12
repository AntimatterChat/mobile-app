// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GIFS_PLUGIN_ID} from '../constants';

import type {GifItem, GifMedia} from '../types';

// The post prop holding the GIF or sticker of a custom_antimatter_gif post (the plugin's server/post.go).
export const GIF_POST_PROP = 'antimatter_gif';

// The largest size of a GIF in a post, as in the plugin's web component.
export const GIF_MAX_WIDTH = 320;
export const GIF_MAX_HEIGHT = 400;
export const GIF_DEFAULT_HEIGHT = 180;
export const STICKER_SIZE = 128;

function isMedia(m: unknown): m is GifMedia {
    return Boolean(m) && typeof (m as GifMedia).url === 'string';
}

// gifMediaUrl returns the address to load a media file from: the plugin's media route on the server,
// or an http(s) URL of the GIF service. Anything else (e.g. a javascript: URL in a forged post) gives
// null. needsAuth tells whether the server's session must go with the request.
export function gifMediaUrl(serverUrl: string, url: string | undefined): {uri: string; needsAuth: boolean} | null {
    if (!url) {
        return null;
    }
    if (url.startsWith(`/plugins/${GIFS_PLUGIN_ID}/media/`) && !url.includes('..')) {
        return {uri: serverUrl.replace(/\/+$/, '') + url, needsAuth: true};
    }
    if ((/^https?:\/\//i).test(url)) {
        return {uri: url, needsAuth: false};
    }
    return null;
}

// parseGifItem checks the item of a post's props, as the plugin's web component does.
export function parseGifItem(value: unknown): GifItem | null {
    const it = value as GifItem;
    if (!it || typeof it !== 'object' || typeof it.id !== 'string' || (it.kind !== 'gif' && it.kind !== 'sticker')) {
        return null;
    }
    if (!isMedia(it.post)) {
        return null;
    }
    const item: GifItem = {...it, preview: isMedia(it.preview) ? it.preview : it.post};
    if (!isMedia(item.image)) {
        delete item.image;
    }
    if (!isMedia(item.still)) {
        delete item.still;
    }
    return item;
}

// gifDisplayMedia picks what to show of a GIF: its animated image when the post's media is a video
// and an image exists (images animate in the app's image view), else the post's media.
export function gifDisplayMedia(item: GifItem): GifMedia {
    if (item.post.video && item.image) {
        return item.image;
    }
    return item.post;
}

// gifDisplaySize returns the size of a GIF in a post: at its aspect ratio, no wider than the
// viewport and the largest GIF size, and no taller than the largest height.
export function gifDisplaySize(media: GifMedia, viewPortWidth: number): {width: number; height: number} {
    let width = Math.min(GIF_MAX_WIDTH, viewPortWidth, media.width || GIF_MAX_WIDTH);
    let height = media.width && media.height ? Math.round((width * media.height) / media.width) : GIF_DEFAULT_HEIGHT;
    if (height > GIF_MAX_HEIGHT) {
        width = Math.round((width * GIF_MAX_HEIGHT) / height);
        height = GIF_MAX_HEIGHT;
    }
    return {width, height};
}
