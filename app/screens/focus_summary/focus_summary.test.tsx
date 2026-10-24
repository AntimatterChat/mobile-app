// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent, screen, waitFor} from '@testing-library/react-native';
import React from 'react';

import {switchToChannelById} from '@actions/remote/channel';
import {fetchFocusSummary, markFocusSummaryRead, markFocusSummarySeen} from '@actions/remote/focus';
import {renderWithIntl} from '@test/intl-test-helper';

import FocusSummary from './focus_summary';

const summary: FocusSummary = {
    since: 1000,
    until: 2000,
    mention_count: 2,
    channels: [
        {channel_id: 'channel1', team_id: 'team1', type: 'O', name: 'town-square', display_name: 'Town Square', count: 3, mention_count: 1, last_post_at: 1500, last_sender_id: 'user1'},
        {channel_id: 'dm1', team_id: '', type: 'D', name: 'dm', display_name: 'Jane', count: 2, mention_count: 1, last_post_at: 1600, last_sender_id: 'user2'},
    ],
    threads: [
        {post_id: 'post1', channel_id: 'channel1', team_id: 'team1', count: 4, mention_count: 0, last_reply_at: 1700, last_sender_id: 'user1'},
    ],
};

jest.mock('@actions/remote/focus', () => ({
    fetchFocusSummary: jest.fn(() => Promise.resolve({summary: undefined})),
    markFocusSummaryRead: jest.fn(() => Promise.resolve({})),
    markFocusSummarySeen: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@actions/remote/thread', () => ({
    fetchAndSwitchToThread: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@actions/remote/channel', () => ({
    switchToChannelById: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'focus_summary.test.com'),
}));

jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));

describe('FocusSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fetchFocusSummary).mockResolvedValue({summary});
    });

    it('fetches and shows what was missed', async () => {
        renderWithIntl(<FocusSummary startAt={1000} endAt={2000}/>);

        await waitFor(() => {
            expect(fetchFocusSummary).toHaveBeenCalledWith('focus_summary.test.com', 1000, 2000);
        });
        expect(await screen.findByTestId('focus_summary.channel.channel1')).toBeVisible();
        expect(screen.getByTestId('focus_summary.channel.dm1')).toBeVisible();
        expect(screen.getByTestId('focus_summary.thread.post1')).toBeVisible();
    });

    it('marks everything read and seen on "Mark all as read"', async () => {
        renderWithIntl(<FocusSummary startAt={1000} endAt={2000}/>);

        fireEvent.press(await screen.findByTestId('focus_summary.mark_all_read.button'));

        await waitFor(() => {
            expect(markFocusSummaryRead).toHaveBeenCalledWith('focus_summary.test.com', 1000, 2000);
            expect(markFocusSummarySeen).toHaveBeenCalledWith('focus_summary.test.com', 1000);
        });
    });

    it('marks seen without marking read on "Show unread badges"', async () => {
        renderWithIntl(<FocusSummary startAt={1000} endAt={2000}/>);

        fireEvent.press(await screen.findByTestId('focus_summary.show_badges.button'));

        await waitFor(() => {
            expect(markFocusSummaryRead).not.toHaveBeenCalled();
            expect(markFocusSummarySeen).toHaveBeenCalledWith('focus_summary.test.com', 1000);
        });
    });

    it('opens the channel when a channel row is pressed', async () => {
        renderWithIntl(<FocusSummary startAt={1000} endAt={2000}/>);

        fireEvent.press(await screen.findByTestId('focus_summary.channel.channel1'));

        await waitFor(() => {
            expect(switchToChannelById).toHaveBeenCalledWith('focus_summary.test.com', 'channel1', 'team1');
        });
    });
});
