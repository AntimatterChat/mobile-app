// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {navigateBack} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import {editMeeting, fetchMeeting} from '../../actions/remote/meetings';

import MeetingEdit from './meeting_edit';

import type {Meeting} from '../../types/calendar';

jest.mock('../../actions/remote/meetings');
jest.mock('@screens/navigation', () => ({
    navigateBack: jest.fn(),
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
    summary: 'Weekly sync',
    description: 'Agenda',
    start: new Date(2026, 11, 15, 14, 0, 0).getTime(),
    end: new Date(2026, 11, 15, 14, 30, 0).getTime(),
    reminder_minutes: 10,
    sequence: 0,
    cancelled: false,
    created_at: 0,
    updated_at: 0,
    can_cancel: true,
};

describe('MeetingEdit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting});
        jest.mocked(editMeeting).mockResolvedValue({data: meeting});
    });

    it('loads the call and pre-fills the form', async () => {
        const {getByTestId, getByDisplayValue} = renderWithIntlAndTheme(<MeetingEdit meetingId='m1'/>);
        await waitFor(() => getByTestId('calendar.meeting_edit'));
        expect(getByDisplayValue('Weekly sync')).toBeTruthy();
        expect(getByDisplayValue('Agenda')).toBeTruthy();
    });

    it('rejects a blank title and does not save', async () => {
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(<MeetingEdit meetingId='m1'/>);
        await waitFor(() => getByTestId('calendar.meeting_edit'));
        fireEvent.changeText(getByTestId('calendar.meeting_edit.summary'), '');
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_edit.save'));
        });
        expect(queryByTestId('calendar.meeting_edit.error')).toBeTruthy();
        expect(editMeeting).not.toHaveBeenCalled();
    });

    it('saves a one-off call with the edited title', async () => {
        const {getByTestId} = renderWithIntlAndTheme(<MeetingEdit meetingId='m1'/>);
        await waitFor(() => getByTestId('calendar.meeting_edit'));
        fireEvent.changeText(getByTestId('calendar.meeting_edit.summary'), 'Renamed sync');
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_edit.save'));
        });
        expect(editMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', expect.objectContaining({
            summary: 'Renamed sync',
            description: 'Agenda',
            start: meeting.start,
            end: meeting.end,
            recurrence_rule: '',
            reminder_minutes: 10,
        }));
        expect(navigateBack).toHaveBeenCalled();
    });

    it('builds a weekly-on-Monday recurrence rule', async () => {
        const {getByTestId} = renderWithIntlAndTheme(<MeetingEdit meetingId='m1'/>);
        await waitFor(() => getByTestId('calendar.meeting_edit'));
        fireEvent.press(getByTestId('calendar.meeting_edit.repeat.WEEKLY'));
        fireEvent.press(getByTestId('calendar.meeting_edit.byday.MO'));
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_edit.save'));
        });
        expect(editMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', expect.objectContaining({
            recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
        }));
    });
});
