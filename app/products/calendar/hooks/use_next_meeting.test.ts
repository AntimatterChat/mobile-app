// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, renderHook} from '@testing-library/react-native';
import {AppState} from 'react-native';

import {fetchNextChannelMeeting} from '../actions/remote/meetings';
import {calendarStore} from '../store';

import {useNextMeeting} from './use_next_meeting';

jest.mock('../actions/remote/meetings');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

describe('useNextMeeting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        calendarStore.clear(SERVER_URL);
        jest.mocked(fetchNextChannelMeeting).mockResolvedValue({data: null});
    });

    it('fetches the channel\'s next call on mount', () => {
        renderHook(() => useNextMeeting('channel1', true));
        expect(fetchNextChannelMeeting).toHaveBeenCalledWith(SERVER_URL, 'channel1');
    });

    it('does not fetch while disabled', () => {
        renderHook(() => useNextMeeting('channel1', false));
        expect(fetchNextChannelMeeting).not.toHaveBeenCalled();
    });

    it('refreshes on meeting_changed for its own channel, not for another', async () => {
        renderHook(() => useNextMeeting('channel1', true));
        jest.mocked(fetchNextChannelMeeting).mockClear();

        await act(async () => {
            calendarStore.emitChanged(SERVER_URL, 'm1', 'channel2');
        });
        expect(fetchNextChannelMeeting).not.toHaveBeenCalled();

        await act(async () => {
            calendarStore.emitChanged(SERVER_URL, 'm1', 'channel1');
        });
        expect(fetchNextChannelMeeting).toHaveBeenCalledWith(SERVER_URL, 'channel1');
    });

    it('refreshes on channel switch', () => {
        const {rerender} = renderHook(({channelId}) => useNextMeeting(channelId, true), {
            initialProps: {channelId: 'channel1'},
        });
        jest.mocked(fetchNextChannelMeeting).mockClear();

        rerender({channelId: 'channel2'});
        expect(fetchNextChannelMeeting).toHaveBeenCalledWith(SERVER_URL, 'channel2');
    });

    it('refreshes when the app comes to the foreground', () => {
        renderHook(() => useNextMeeting('channel1', true));
        jest.mocked(fetchNextChannelMeeting).mockClear();

        const listener = jest.mocked(AppState.addEventListener).mock.calls.slice(-1)[0][1];
        act(() => {
            listener('active');
        });
        expect(fetchNextChannelMeeting).toHaveBeenCalledWith(SERVER_URL, 'channel1');
    });

    it('throttles the clock-driven re-check once the shown occurrence has ended', () => {
        // meeting_changed, a channel switch and app foreground always read again (tested
        // above); only the clock-driven "the occurrence ended" re-check respects the
        // one-minute floor, and the mount below's own forced read already covers it.
        calendarStore.setNextMeeting(SERVER_URL, 'channel1', {
            meeting_id: 'm1',
            post_id: 'p1',
            summary: 'Sync',
            start: Date.now() - 2000,
            end: Date.now() - 1000,
            live: false,
            recurring: false,
        });

        renderHook(() => useNextMeeting('channel1', true));

        expect(fetchNextChannelMeeting).toHaveBeenCalledTimes(1);
    });
});
