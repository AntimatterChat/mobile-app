// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {navigateBack} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {fetchGifs, fetchGifsConfig, postGif} from '../../actions/remote/gifs';

import GifPicker from './index';

import type {GifItem} from '../../types';

jest.mock('@screens/navigation', () => ({
    navigateBack: jest.fn(),
}));

jest.mock('@hooks/android_back_handler', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../actions/remote/gifs');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

const gif = (id: string, kind: GifItem['kind'] = 'gif'): GifItem => ({
    id,
    kind,
    title: `Item ${id}`,
    preview: {url: `/plugins/com.antimatterchat.gifs/media/1/${id}/tinygif.gif`, width: 220, height: 165},
    post: {url: `/plugins/com.antimatterchat.gifs/media/1/${id}/mp4.mp4`, video: true},
});

describe('GifPicker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fetchGifsConfig).mockResolvedValue({config: {configured: true, stickers: true}});
        jest.mocked(fetchGifs).mockResolvedValue({page: {items: [gif('1'), gif('2')]}});
        jest.mocked(postGif).mockResolvedValue({data: true});
    });

    it('should show the featured GIFs and send the one picked', async () => {
        const {findByTestId, getByTestId} = renderWithIntlAndTheme(
            <GifPicker
                channelId='channel1'
                rootId='root1'
            />,
        );

        await findByTestId('gif_picker.item.1');
        expect(fetchGifs).toHaveBeenCalledWith(SERVER_URL, 'gif', '', undefined);

        await act(async () => {
            fireEvent.press(getByTestId('gif_picker.item.2'));
        });
        expect(postGif).toHaveBeenCalledWith(SERVER_URL, gif('2'), 'channel1', 'root1', '');
        expect(navigateBack).toHaveBeenCalled();
    });

    it('should search stickers', async () => {
        jest.useFakeTimers({doNotFake: ['nextTick']});
        const {findByTestId, getByTestId} = renderWithIntlAndTheme(<GifPicker channelId='channel1'/>);
        await findByTestId('gif_picker.tab.stickers');

        fireEvent.press(getByTestId('gif_picker.tab.stickers'));
        fireEvent.changeText(getByTestId('gif_picker.search_bar.search.input'), 'cat');
        await act(async () => {
            jest.advanceTimersByTime(400);
        });
        await waitFor(() => expect(fetchGifs).toHaveBeenLastCalledWith(SERVER_URL, 'sticker', 'cat', undefined));
        jest.useRealTimers();
    });

    it('should say when GIFs aren\'t set up, and when sending fails', async () => {
        jest.mocked(fetchGifsConfig).mockResolvedValue({config: {configured: false, stickers: false}});
        const first = renderWithIntlAndTheme(<GifPicker channelId='channel1'/>);
        expect(await first.findByText('GIFs aren’t set up yet: ask a system admin to configure the GIFs plugin.')).toBeTruthy();
        expect(fetchGifs).not.toHaveBeenCalled();
        first.unmount();

        jest.mocked(fetchGifsConfig).mockResolvedValue({config: {configured: true, stickers: false}});
        jest.mocked(postGif).mockResolvedValue({error: new Error('not allowed')});
        const {findByTestId, getByTestId, findByText} = renderWithIntlAndTheme(<GifPicker channelId='channel1'/>);
        await findByTestId('gif_picker.item.1');
        await act(async () => {
            fireEvent.press(getByTestId('gif_picker.item.1'));
        });
        expect(await findByText('Couldn’t send it: not allowed')).toBeTruthy();
        expect(navigateBack).not.toHaveBeenCalled();
    });
});
