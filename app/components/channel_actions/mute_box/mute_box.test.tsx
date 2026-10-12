// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {muteChannelFor, unmuteChannel} from '@actions/remote/timed_mute';
import {fireEvent, renderWithIntlAndTheme, waitFor} from '@test/intl-test-helper';
import {showMuteChannelSnackbar} from '@utils/snack_bar';

import MuteBox from './mute_box';
import MuteDurations, {showMuteDurations} from './mute_durations';

jest.mock('@actions/remote/timed_mute', () => ({
    muteChannelFor: jest.fn(() => Promise.resolve({})),
    unmuteChannel: jest.fn(() => Promise.resolve({})),
}));
jest.mock('@screens/navigation', () => ({
    bottomSheet: jest.fn(),
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));
jest.mock('@utils/snack_bar', () => ({showMuteChannelSnackbar: jest.fn()}));
jest.mock('@context/server', () => ({useServerUrl: jest.fn(() => 'server.url')}));
jest.mock('./mute_durations', () => ({
    __esModule: true,
    ...jest.requireActual('./mute_durations'),
    showMuteDurations: jest.fn(),
}));

describe('MuteBox', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should ask for how long to mute', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <MuteBox
                channelId='c1'
                isMuted={false}
                showSnackBar={true}
                testID='channel'
            />,
        );

        fireEvent.press(getByTestId('channel.mute.action'));
        await waitFor(() => expect(showMuteDurations).toHaveBeenCalledWith('c1', true));
        expect(muteChannelFor).not.toHaveBeenCalled();
    });

    it('should unmute at once', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <MuteBox
                channelId='c1'
                isMuted={true}
                showSnackBar={true}
                testID='channel'
            />,
        );

        fireEvent.press(getByTestId('channel.unmute.action'));
        await waitFor(() => expect(unmuteChannel).toHaveBeenCalledWith('server.url', 'c1'));
        expect(showMuteChannelSnackbar).toHaveBeenCalledWith(false, expect.any(Function));
    });
});

describe('MuteDurations', () => {
    it('should mute for the duration chosen', async () => {
        const {getByText} = renderWithIntlAndTheme(
            <MuteDurations
                channelId='c1'
                showSnackBar={false}
            />,
        );

        expect(getByText('For 1 hour')).toBeTruthy();
        expect(getByText('For 24 hours')).toBeTruthy();
        fireEvent.press(getByText('For 8 hours'));
        await waitFor(() => expect(muteChannelFor).toHaveBeenCalledWith('server.url', 'c1', 8 * 3600 * 1000));

        fireEvent.press(getByText('Until I turn it back on'));
        await waitFor(() => expect(muteChannelFor).toHaveBeenCalledWith('server.url', 'c1', 0));
    });
});
