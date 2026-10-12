// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import NetworkManager from '@managers/network_manager';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import GifPost from './index';

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

const media = (name: string, extra = {}) => ({url: `/plugins/com.antimatterchat.gifs/media/32/1/${name}`, width: 240, height: 180, ...extra});

describe('GifPost', () => {
    beforeEach(() => {
        jest.spyOn(NetworkManager, 'getClient').mockReturnValue({getRequestHeaders: () => ({Authorization: 'Bearer token'})} as any);
    });

    it('should show the animated GIF of a video GIF at its aspect ratio, with the session', () => {
        const post = TestHelper.fakePostModel({
            type: 'custom_antimatter_gif',
            props: {antimatter_gif: {id: '1', kind: 'gif', title: 'Lights', post: media('mp4.mp4', {video: true}), image: media('gif.gif')}},
        });
        const {getByTestId, getByLabelText, getByText} = renderWithIntlAndTheme(
            <GifPost
                isReplyPost={false}
                post={post}
            />,
        );

        expect(getByTestId('gif_post.gif.1')).toBeTruthy();
        expect(getByText('GIF')).toBeTruthy();
        const image = getByLabelText('GIF: Lights');
        expect([image.props.source].flat()[0]).toMatchObject({
            uri: `${SERVER_URL}/plugins/com.antimatterchat.gifs/media/32/1/gif.gif`,
            headers: {Authorization: 'Bearer token'},
        });
        expect(image.props.style).toMatchObject({width: 240, height: 180});
    });

    it('should show a sticker at the sticker size', () => {
        const post = TestHelper.fakePostModel({
            type: 'custom_antimatter_gif',
            props: {antimatter_gif: {id: '2', kind: 'sticker', title: 'Cat approved', post: media('sticker.webp', {width: 220, height: 220})}},
        });
        const {getByLabelText} = renderWithIntlAndTheme(
            <GifPost
                isReplyPost={false}
                post={post}
            />,
        );

        expect(getByLabelText('Sticker: Cat approved').props.style).toMatchObject({width: 128, height: 128});
    });
});
