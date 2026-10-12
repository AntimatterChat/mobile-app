// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {GIF_MAX_HEIGHT, gifDisplayMedia, gifDisplaySize, gifMediaUrl, parseGifItem} from './gifs';

const serverUrl = 'https://chat.example.com';
const media = (name: string, extra = {}) => ({url: `/plugins/com.antimatterchat.gifs/media/32/1/${name}`, width: 240, height: 180, ...extra});

describe('gifs utils', () => {
    it('should load the plugin\'s media from the server, with the session', () => {
        expect(gifMediaUrl(serverUrl, '/plugins/com.antimatterchat.gifs/media/32/1/gif.gif')).toEqual({
            uri: 'https://chat.example.com/plugins/com.antimatterchat.gifs/media/32/1/gif.gif',
            needsAuth: true,
        });
        expect(gifMediaUrl(`${serverUrl}/`, '/plugins/com.antimatterchat.gifs/media/a.gif')?.uri).toBe('https://chat.example.com/plugins/com.antimatterchat.gifs/media/a.gif');
    });

    it('should load the GIF service\'s media directly and refuse other addresses', () => {
        expect(gifMediaUrl(serverUrl, 'https://media.tenor.com/a.gif')).toEqual({uri: 'https://media.tenor.com/a.gif', needsAuth: false});
        // eslint-disable-next-line no-script-url
        expect(gifMediaUrl(serverUrl, 'javascript:alert(1)')).toBeNull();
        expect(gifMediaUrl(serverUrl, '/plugins/com.antimatterchat.gifs/media/../../api/v4/users/me')).toBeNull();
        expect(gifMediaUrl(serverUrl, '/api/v4/users/me')).toBeNull();
        expect(gifMediaUrl(serverUrl, undefined)).toBeNull();
    });

    it('should check the item of a post', () => {
        expect(parseGifItem(undefined)).toBeNull();
        expect(parseGifItem({id: '1', kind: 'video', post: media('mp4.mp4')})).toBeNull();
        expect(parseGifItem({id: '1', kind: 'gif'})).toBeNull();

        const item = parseGifItem({id: '1', kind: 'gif', post: media('mp4.mp4', {video: true}), image: media('gif.gif'), still: {}});
        expect(item?.preview).toEqual(item?.post);
        expect(item?.image?.url).toContain('gif.gif');
        expect(item && 'still' in item).toBe(false);
    });

    it('should show the animated image of a video GIF when there is one', () => {
        const video = media('mp4.mp4', {video: true});
        const image = media('gif.gif');
        expect(gifDisplayMedia({id: '1', kind: 'gif', preview: video, post: video, image})).toBe(image);
        expect(gifDisplayMedia({id: '1', kind: 'gif', preview: video, post: video})).toBe(video);
    });

    it('should size a GIF at its aspect ratio within the limits', () => {
        expect(gifDisplaySize({url: '', width: 240, height: 180}, 400)).toEqual({width: 240, height: 180});
        expect(gifDisplaySize({url: '', width: 480, height: 360}, 400)).toEqual({width: 320, height: 240});
        expect(gifDisplaySize({url: '', width: 480, height: 360}, 200)).toEqual({width: 200, height: 150});
        expect(gifDisplaySize({url: '', width: 100, height: 1000}, 400)).toEqual({width: 40, height: GIF_MAX_HEIGHT});
        expect(gifDisplaySize({url: ''}, 400)).toEqual({width: 320, height: 180});
    });
});
