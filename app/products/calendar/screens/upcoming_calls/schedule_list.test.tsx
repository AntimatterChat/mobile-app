// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {showPermalink} from '@actions/remote/permalink';
import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import ScheduleList from './schedule_list';

import type {MeetingOccurrence} from '../../types/calendar';

jest.mock('@actions/remote/permalink');
jest.mock('@calls/actions/calls');

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

const occurrence = (overrides: Partial<MeetingOccurrence>): MeetingOccurrence => ({
    meeting_id: 'm1',
    post_id: 'p1',
    channel_id: 'c1',
    channel_name: 'standup',
    channel_display_name: 'Standup',
    channel_type: 'O',
    organizer_id: 'u1',
    summary: 'Call',
    start: Date.now(),
    end: Date.now() + (30 * 60 * 1000),
    recurring: false,
    ...overrides,
});

describe('ScheduleList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows the empty state with no occurrences', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <ScheduleList
                occurrences={[]}
                loading={false}
                onRefresh={jest.fn()}
                onLoadMore={jest.fn()}
            />,
        );
        expect(getByTestId('calendar.schedule.empty')).toBeTruthy();
    });

    it('opens the post when a row is tapped', () => {
        const o = occurrence({});
        const {getByTestId} = renderWithIntlAndTheme(
            <ScheduleList
                occurrences={[o]}
                loading={false}
                onRefresh={jest.fn()}
                onLoadMore={jest.fn()}
            />,
        );
        fireEvent.press(getByTestId(`calendar.schedule.row.${o.meeting_id}`));
        expect(showPermalink).toHaveBeenCalledWith('https://appv1.mattermost.com', '', 'p1');
    });

    it('shows Live . Join for a call running now, and joins on tap', () => {
        const now = Date.now();
        const o = occurrence({start: now - 1000, end: now + 60000});
        const {getByTestId} = renderWithIntlAndTheme(
            <ScheduleList
                occurrences={[o]}
                loading={false}
                onRefresh={jest.fn()}
                onLoadMore={jest.fn()}
            />,
        );
        fireEvent.press(getByTestId(`calendar.schedule.join.${o.meeting_id}`));
        expect(joinCallAndOpenCallScreen).toHaveBeenCalledWith(expect.anything(), 'https://appv1.mattermost.com', 'c1');
    });

    it('asks to load more as the list scrolls to the end', () => {
        const onLoadMore = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <ScheduleList
                occurrences={[occurrence({})]}
                loading={false}
                onRefresh={jest.fn()}
                onLoadMore={onLoadMore}
            />,
        );
        fireEvent(getByTestId('calendar.schedule.list'), 'onEndReached');
        expect(onLoadMore).toHaveBeenCalled();
    });
});
