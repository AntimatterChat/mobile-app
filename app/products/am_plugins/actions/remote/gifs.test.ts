// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';

import {fetchGifs, fetchGifsConfig, postGif} from './gifs';

import type {GifItem} from '../../types';

jest.mock('@managers/network_manager');
jest.mock('@actions/remote/session');
jest.mock('@utils/log');

const serverUrl = 'https://server.example.com';

const item: GifItem = {id: '1', kind: 'gif', preview: {url: '/p.gif'}, post: {url: '/p.mp4', video: true}};

describe('gifs actions', () => {
    const client = {
        getGifsConfig: jest.fn(),
        getFeaturedGifs: jest.fn(),
        searchGifs: jest.fn(),
        postGif: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as any);
    });

    it('should show the featured GIFs before a search, and the matches after', async () => {
        client.getFeaturedGifs.mockResolvedValue({items: [item], next: '2'});
        expect(await fetchGifs(serverUrl, 'gif', '  ')).toEqual({page: {items: [item], next: '2'}});
        expect(client.getFeaturedGifs).toHaveBeenCalledWith('gif', undefined);

        client.searchGifs.mockResolvedValue({items: []});
        expect(await fetchGifs(serverUrl, 'sticker', ' cat ', '2')).toEqual({page: {items: [], next: undefined}});
        expect(client.searchGifs).toHaveBeenCalledWith('sticker', 'cat', '2');
    });

    it('should return the error when the GIF service fails', async () => {
        client.getGifsConfig.mockRejectedValue(new Error('down'));
        expect((await fetchGifsConfig(serverUrl)).error).toBeDefined();

        client.getFeaturedGifs.mockRejectedValue(new Error('down'));
        expect((await fetchGifs(serverUrl, 'gif', '')).error).toBeDefined();
    });

    it('should send a GIF to a thread', async () => {
        client.postGif.mockResolvedValue({});
        expect(await postGif(serverUrl, item, 'channel1', 'root1', 'cat')).toEqual({data: true});
        expect(client.postGif).toHaveBeenCalledWith(item, 'channel1', 'root1', 'cat');
    });
});
