// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {dismissBottomSheet} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {setMeetingReminder} from '../../actions/remote/meetings';

import RemindMeSheet from './remind_me_sheet';

import type {Meeting} from '../../types/calendar';

jest.mock('../../actions/remote/meetings');
jest.mock('@screens/navigation', () => ({
    dismissBottomSheet: jest.fn(() => Promise.resolve()),
}));

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

const meeting: Meeting = {
    id: 'm1',
    channel_id: 'c1',
    team_id: 't1',
    post_id: 'p1',
    organizer_id: 'o1',
    summary: 'Sync',
    description: '',
    start: 0,
    end: 0,
    reminder_minutes: 10,
    sequence: 0,
    cancelled: false,
    created_at: 0,
    updated_at: 0,
    can_cancel: false,
};

describe('RemindMeSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(setMeetingReminder).mockResolvedValue({data: meeting});
    });

    it('lists the fixed choices plus Default', () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <RemindMeSheet
                meeting={meeting}
                onChanged={jest.fn()}
            />,
        );
        expect(getByTestId('calendar.remind_me_sheet.option.null')).toBeTruthy();
        for (const minutes of [-1, 0, 5, 10, 15, 30, 60, 1440]) {
            expect(getByTestId(`calendar.remind_me_sheet.option.${minutes}`)).toBeTruthy();
        }
    });

    it('sends the chosen minutes and dismisses', async () => {
        const onChanged = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <RemindMeSheet
                meeting={meeting}
                onChanged={onChanged}
            />,
        );
        await act(async () => {
            fireEvent.press(getByTestId('calendar.remind_me_sheet.option.60'));
        });
        expect(setMeetingReminder).toHaveBeenCalledWith(SERVER_URL, 'm1', 60);
        expect(dismissBottomSheet).toHaveBeenCalled();
        await waitFor(() => expect(onChanged).toHaveBeenCalledWith(meeting));
    });

    it('sends null for Default', async () => {
        const {getByTestId} = renderWithIntlAndTheme(
            <RemindMeSheet
                meeting={meeting}
                onChanged={jest.fn()}
            />,
        );
        await act(async () => {
            fireEvent.press(getByTestId('calendar.remind_me_sheet.option.null'));
        });
        expect(setMeetingReminder).toHaveBeenCalledWith(SERVER_URL, 'm1', null);
    });
});
