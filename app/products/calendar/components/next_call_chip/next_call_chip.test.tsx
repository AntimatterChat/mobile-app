// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {showPermalink} from '@actions/remote/permalink';
import {usePluginEnabled} from '@am_plugins/hooks/composer_actions';
import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {useNextMeeting} from '../../hooks/use_next_meeting';

import NextCallChip from './next_call_chip';

import type {NextMeeting} from '../../types/calendar';

jest.mock('@am_plugins/hooks/composer_actions');
jest.mock('@calls/actions/calls');
jest.mock('@actions/remote/permalink');
jest.mock('../../hooks/use_next_meeting');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

const next = (overrides: Partial<NextMeeting> = {}): NextMeeting => ({
    meeting_id: 'm1',
    post_id: 'p1',
    summary: 'Weekly sync',
    start: Date.now() + (3 * 60 * 60 * 1000),
    end: Date.now() + (3 * 60 * 60 * 1000) + (30 * 60 * 1000),
    live: false,
    recurring: false,
    ...overrides,
});

describe('NextCallChip', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(usePluginEnabled).mockReturnValue(true);
    });

    it('is hidden when the Calendar app is off', () => {
        jest.mocked(usePluginEnabled).mockReturnValue(false);
        jest.mocked(useNextMeeting).mockReturnValue({next: next(), now: Date.now()});
        const {queryByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(queryByTestId('channel_header.next_call_chip')).toBeNull();
    });

    it.each(['D', 'G'] as const)('is hidden in a %s channel', (channelType) => {
        jest.mocked(useNextMeeting).mockReturnValue({next: next(), now: Date.now()});
        const {queryByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType={channelType}
                canJoinCalls={true}
            />,
        );
        expect(queryByTestId('channel_header.next_call_chip')).toBeNull();
    });

    it('is hidden when there is no next call', () => {
        jest.mocked(useNextMeeting).mockReturnValue({next: null, now: Date.now()});
        const {queryByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(queryByTestId('channel_header.next_call_chip')).toBeNull();
    });

    it('shows "Next call" with the time and title when upcoming', () => {
        const n = next();
        jest.mocked(useNextMeeting).mockReturnValue({next: n, now: n.start - (3 * 60 * 60 * 1000)});
        const {getByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        const label = getByTestId('channel_header.next_call_chip.label');
        expect(label.props.children).toContain('Next call:');
        expect(label.props.children).toContain('Weekly sync');
        expect(() => getByTestId('channel_header.next_call_chip.join')).toThrow();
    });

    it('shows "in N min" during the last hour', () => {
        const n = next();
        jest.mocked(useNextMeeting).mockReturnValue({next: n, now: n.start - (10 * 60 * 1000)});
        const {getByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(getByTestId('channel_header.next_call_chip.label').props.children).toContain('10 min');
    });

    it('shows Live and a Join button while the call runs, gated by canJoinCalls', () => {
        const n = next();
        jest.mocked(useNextMeeting).mockReturnValue({next: n, now: n.start});
        const {getByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(getByTestId('channel_header.next_call_chip.label').props.children).toContain('Live');
        fireEvent.press(getByTestId('channel_header.next_call_chip.join'));
        expect(joinCallAndOpenCallScreen).toHaveBeenCalledWith(expect.anything(), SERVER_URL, 'c1');
    });

    it('hides Join when the Calls app is not available, even while live', () => {
        const n = next();
        jest.mocked(useNextMeeting).mockReturnValue({next: n, now: n.start});
        const {queryByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={false}
            />,
        );
        expect(queryByTestId('channel_header.next_call_chip.join')).toBeNull();
    });

    it('tapping the chip opens the post (permalink)', () => {
        const n = next();
        jest.mocked(useNextMeeting).mockReturnValue({next: n, now: n.start - (3 * 60 * 60 * 1000)});
        const {getByTestId} = renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        fireEvent.press(getByTestId('channel_header.next_call_chip'));
        expect(showPermalink).toHaveBeenCalledWith(SERVER_URL, '', 'p1');
    });

    it('asks useNextMeeting to refresh for this channel, and not when disabled', () => {
        jest.mocked(useNextMeeting).mockReturnValue({next: null, now: Date.now()});
        renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(useNextMeeting).toHaveBeenCalledWith('c1', true);

        jest.mocked(usePluginEnabled).mockReturnValue(false);
        renderWithIntlAndTheme(
            <NextCallChip
                channelId='c1'
                channelType='O'
                canJoinCalls={true}
            />,
        );
        expect(useNextMeeting).toHaveBeenCalledWith('c1', false);
    });
});
