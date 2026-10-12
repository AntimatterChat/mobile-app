// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, renderHook} from '@testing-library/react-native';
import React from 'react';
import {IntlProvider} from 'react-intl';

import {Screens} from '@constants';
import {navigateToScreen} from '@screens/navigation';

import {amPluginsStore} from '../store';

import {useComposerPluginActions} from './composer_actions';

jest.mock('@screens/navigation', () => ({
    navigateToScreen: jest.fn(),
}));

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

const wrapper = ({children}: {children: React.ReactNode}) => React.createElement(IntlProvider, {locale: 'en'}, children);

describe('useComposerPluginActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        amPluginsStore.clear(SERVER_URL);
    });

    it('should offer to create a poll when the server runs the polls plugin', () => {
        const {result} = renderHook(() => useComposerPluginActions('channel1', 'root1'), {wrapper});
        expect(result.current).toEqual([]);

        act(() => {
            amPluginsStore.setEnabledPlugins(SERVER_URL, ['com.antimatterchat.polls']);
        });
        expect(result.current).toHaveLength(1);
        expect(result.current[0].text).toBe('Create a poll');

        result.current[0].onPress();
        expect(navigateToScreen).toHaveBeenCalledWith(Screens.AM_CREATE_POLL, {channelId: 'channel1', rootId: 'root1'});
    });

    it('should offer to send a GIF or sticker when the server runs the GIFs plugin', () => {
        amPluginsStore.setEnabledPlugins(SERVER_URL, ['com.antimatterchat.gifs']);
        const {result} = renderHook(() => useComposerPluginActions('channel1'), {wrapper});

        expect(result.current.map((a) => a.text)).toEqual(['GIF or sticker']);
        result.current[0].onPress();
        expect(navigateToScreen).toHaveBeenCalledWith(Screens.AM_GIF_PICKER, {channelId: 'channel1', rootId: ''});
    });

    it('should offer nothing outside a channel', () => {
        amPluginsStore.setEnabledPlugins(SERVER_URL, ['com.antimatterchat.polls']);
        const {result} = renderHook(() => useComposerPluginActions(undefined), {wrapper});
        expect(result.current).toEqual([]);
    });
});
