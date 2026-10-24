// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {useAnyMeetingLive} from '../../hooks/use_any_meeting_live';
import {goToUpcomingCalls} from '../../screens/navigation';

import UpcomingCallsButton from './upcoming_calls_button';

jest.mock('../../hooks/use_any_meeting_live');
jest.mock('../../screens/navigation');
jest.mock('@hooks/device', () => ({
    useIsTablet: jest.fn(() => false),
}));

describe('UpcomingCallsButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useAnyMeetingLive).mockReturnValue(false);
    });

    it('opens the Upcoming calls screen when pressed', () => {
        const {getByTestId} = renderWithIntlAndTheme(<UpcomingCallsButton teamId='t1'/>);
        fireEvent.press(getByTestId('channel_list.upcoming_calls.button'));
        expect(goToUpcomingCalls).toHaveBeenCalledWith(false);
    });

    it('shows no dot when nothing is live', () => {
        const {queryByTestId} = renderWithIntlAndTheme(<UpcomingCallsButton teamId='t1'/>);
        expect(queryByTestId('channel_list.upcoming_calls.live_dot')).toBeNull();
    });

    it('shows a dot when a call is live', () => {
        jest.mocked(useAnyMeetingLive).mockReturnValue(true);
        const {getByTestId} = renderWithIntlAndTheme(<UpcomingCallsButton teamId='t1'/>);
        expect(getByTestId('channel_list.upcoming_calls.live_dot')).toBeTruthy();
    });
});
