// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import {useIsFocused} from '@react-navigation/native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {useMeetingsRange} from '../../hooks/use_meetings_range';
import {useScheduleMeetings} from '../../hooks/use_schedule_meetings';
import {useUpcomingCallsView} from '../../hooks/use_upcoming_calls_view';

import UpcomingCalls from './upcoming_calls';

jest.mock('@react-navigation/native', () => ({
    useIsFocused: jest.fn(() => true),
}));
jest.mock('../../hooks/use_schedule_meetings');
jest.mock('../../hooks/use_meetings_range');
jest.mock('../../hooks/use_upcoming_calls_view');
jest.mock('@actions/remote/permalink');
jest.mock('@calls/actions/calls');

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

describe('UpcomingCalls', () => {
    const schedule = {occurrences: [], loading: false, refresh: jest.fn(), loadMore: jest.fn()};
    const grid = {occurrences: [], loading: false, refresh: jest.fn()};

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useIsFocused).mockReturnValue(true);
        jest.mocked(useScheduleMeetings).mockReturnValue(schedule);
        jest.mocked(useMeetingsRange).mockReturnValue(grid);
    });

    it('defaults to, and remembers, the last chosen view', () => {
        const setView = jest.fn();
        jest.mocked(useUpcomingCallsView).mockReturnValue(['week', setView]);
        const {getByTestId} = renderWithIntlAndTheme(<UpcomingCalls teamId='t1'/>);

        expect(getByTestId('calendar.grid.pager')).toBeTruthy();

        fireEvent.press(getByTestId('calendar.upcoming_calls.switch.day'));
        expect(setView).toHaveBeenCalledWith('day');
    });

    it('shows the Schedule list by default', () => {
        jest.mocked(useUpcomingCallsView).mockReturnValue(['schedule', jest.fn()]);
        const {getByTestId} = renderWithIntlAndTheme(<UpcomingCalls teamId='t1'/>);
        expect(getByTestId('calendar.schedule.list')).toBeTruthy();
    });

    it('refreshes the current view on focus', () => {
        jest.mocked(useUpcomingCallsView).mockReturnValue(['schedule', jest.fn()]);
        renderWithIntlAndTheme(<UpcomingCalls teamId='t1'/>);
        expect(schedule.refresh).toHaveBeenCalled();
    });
});
