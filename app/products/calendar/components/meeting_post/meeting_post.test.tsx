// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';
import {Alert} from 'react-native';

import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import {navigateToScreen} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {downloadAndShareMeetingIcs} from '../../actions/remote/ics';
import {cancelMeeting, fetchMeeting, rsvpMeeting} from '../../actions/remote/meetings';

import MeetingPost, {isCalendarMeetingPost} from './meeting_post';

import type {Meeting} from '../../types/calendar';

jest.mock('../../actions/remote/meetings');
jest.mock('../../actions/remote/ics');
jest.mock('@calls/actions/calls');
jest.mock('@screens/navigation', () => ({
    bottomSheet: jest.fn(),
    navigateToScreen: jest.fn(),
    dismissBottomSheet: jest.fn(),
}));

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://appv1.mattermost.com'),
}));

const meeting = (overrides: Partial<Meeting> = {}): Meeting => ({
    id: 'm1',
    channel_id: 'c1',
    team_id: 't1',
    post_id: 'p1',
    organizer_id: 'organizer1',
    summary: 'Weekly sync',
    description: '',
    start: new Date(2026, 11, 15, 14, 0, 0).getTime(),
    end: new Date(2026, 11, 15, 14, 30, 0).getTime(),
    reminder_minutes: 10,
    sequence: 0,
    cancelled: false,
    created_at: 0,
    updated_at: 0,
    can_cancel: false,
    ...overrides,
});

const post = TestHelper.fakePostModel({id: 'post1', channelId: 'c1', type: 'custom_calendar_meeting', props: {meeting_id: 'm1'}, message: 'A call was scheduled.'});

describe('isCalendarMeetingPost', () => {
    it('is true only for a meeting post with a meeting_id', () => {
        expect(isCalendarMeetingPost(post)).toBe(true);
        expect(isCalendarMeetingPost(TestHelper.fakePostModel({type: 'custom_calendar_meeting', props: {}}))).toBe(false);
        expect(isCalendarMeetingPost(TestHelper.fakePostModel({type: ''}))).toBe(false);
    });
});

describe('MeetingPost', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(rsvpMeeting).mockResolvedValue({data: meeting()});
        jest.mocked(cancelMeeting).mockResolvedValue({data: meeting({cancelled: true})});
    });

    it('shows the fallback message while the Calendar app is off (or the call is gone)', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: undefined, error: new Error('404')} as never);
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.unavailable'));
        expect(getByTestId('calendar.meeting_post.unavailable').props.children).toBe('A call was scheduled.');
    });

    it('renders a single call: title, time, Join and RSVP', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting()});
        const {getByTestId, getByText, queryByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post'));
        expect(getByText('Weekly sync')).toBeTruthy();
        expect(getByTestId('calendar.meeting_post.join')).toBeTruthy();
        expect(getByTestId('calendar.meeting_post.rsvp_going')).toBeTruthy();
        expect(queryByTestId('calendar.meeting_post.next_only')).toBeNull();
    });

    it('renders a recurring call: the repeat rule and the next occurrence', async () => {
        const next = meeting({
            recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO',
            next_start: new Date(2026, 11, 22, 14, 0, 0).getTime(),
            next_end: new Date(2026, 11, 22, 14, 30, 0).getTime(),
        });
        jest.mocked(fetchMeeting).mockResolvedValue({data: next});
        const {getByTestId, getByText} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post'));
        expect(getByText(/Weekly on Monday/)).toBeTruthy();
        expect(getByText(/Next:/)).toBeTruthy();
        expect(getByTestId('calendar.meeting_post.next_only')).toBeTruthy();
    });

    it('renders the cancelled state and hides Join, RSVP, Remind me, Edit and Cancel', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({cancelled: true, organizer_id: 'member1', can_cancel: true})});
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.cancelled'));
        expect(queryByTestId('calendar.meeting_post.join')).toBeNull();
        expect(queryByTestId('calendar.meeting_post.rsvp_going')).toBeNull();
        expect(queryByTestId('calendar.meeting_post.remind_me')).toBeNull();
        expect(queryByTestId('calendar.meeting_post.edit')).toBeNull();
        expect(queryByTestId('calendar.meeting_post.cancel')).toBeNull();
        expect(getByTestId('calendar.meeting_post.add_to_calendar')).toBeTruthy();
    });

    describe('buttons per role', () => {
        it('shows Edit to the organiser only', async () => {
            jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({organizer_id: 'organizer1'})});
            const {getByTestId} = renderWithIntlAndTheme(
                <MeetingPost
                    post={post}
                    isReplyPost={false}
                    currentUserId='organizer1'
                />,
            );
            await waitFor(() => getByTestId('calendar.meeting_post.edit'));
        });

        it('shows Cancel when can_cancel is true', async () => {
            jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({can_cancel: true})});
            const {getByTestId} = renderWithIntlAndTheme(
                <MeetingPost
                    post={post}
                    isReplyPost={false}
                    currentUserId='member1'
                />,
            );
            await waitFor(() => getByTestId('calendar.meeting_post.cancel'));
        });

        it('hides Edit and Cancel from a plain member', async () => {
            jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({organizer_id: 'organizer1', can_cancel: false})});
            const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
                <MeetingPost
                    post={post}
                    isReplyPost={false}
                    currentUserId='member1'
                />,
            );
            await waitFor(() => getByTestId('calendar.meeting_post'));
            expect(queryByTestId('calendar.meeting_post.edit')).toBeNull();
            expect(queryByTestId('calendar.meeting_post.cancel')).toBeNull();
        });

        it('hides Remind me from a member who declined', async () => {
            jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({my_rsvp: 'no'})});
            const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
                <MeetingPost
                    post={post}
                    isReplyPost={false}
                    currentUserId='member1'
                />,
            );
            await waitFor(() => getByTestId('calendar.meeting_post'));
            expect(queryByTestId('calendar.meeting_post.remind_me')).toBeNull();
        });
    });

    it('Join uses mobile Calls\' join action', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting()});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.join'));
        fireEvent.press(getByTestId('calendar.meeting_post.join'));
        expect(joinCallAndOpenCallScreen).toHaveBeenCalledWith(expect.anything(), SERVER_URL, 'c1');
    });

    it('sends the RSVP for the whole series by default', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({recurrence_rule: 'FREQ=WEEKLY', next_start: meeting().start + 1, next_end: meeting().end + 1})});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.rsvp_going'));
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_post.rsvp_going'));
        });
        expect(rsvpMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', {status: 'going', scope: undefined});
    });

    it('sends "next" scope once "Only the next call" is checked', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({recurrence_rule: 'FREQ=WEEKLY', next_start: meeting().start + 1, next_end: meeting().end + 1})});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.next_only'));
        fireEvent.press(getByTestId('calendar.meeting_post.next_only'));
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_post.rsvp_maybe'));
        });
        expect(rsvpMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', {status: 'maybe', scope: 'next'});
    });

    it('Add to calendar fetches and shares the ics', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting()});
        jest.mocked(downloadAndShareMeetingIcs).mockResolvedValue({data: true});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.add_to_calendar'));
        await act(async () => {
            fireEvent.press(getByTestId('calendar.meeting_post.add_to_calendar'));
        });
        expect(downloadAndShareMeetingIcs).toHaveBeenCalledWith(SERVER_URL, 'm1');
    });

    it('Edit navigates to the edit screen for the organiser', async () => {
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({organizer_id: 'organizer1'})});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='organizer1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.edit'));
        fireEvent.press(getByTestId('calendar.meeting_post.edit'));
        expect(navigateToScreen).toHaveBeenCalledWith('calendar_meeting_edit', {meetingId: 'm1'});
    });

    it('cancelling a one-off call confirms once, then cancels it', async () => {
        jest.spyOn(Alert, 'alert');
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({can_cancel: true})});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.cancel'));
        fireEvent.press(getByTestId('calendar.meeting_post.cancel'));

        const confirmCall = jest.mocked(Alert.alert).mock.calls[0];
        const confirmButton = confirmCall[2]?.[1];
        await act(async () => {
            confirmButton?.onPress?.();
        });
        expect(cancelMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', undefined);
    });

    it('cancelling a recurring call offers "This call" or "The whole series"', async () => {
        jest.spyOn(Alert, 'alert');
        jest.mocked(fetchMeeting).mockResolvedValue({data: meeting({can_cancel: true, recurrence_rule: 'FREQ=WEEKLY'})});
        const {getByTestId} = renderWithIntlAndTheme(
            <MeetingPost
                post={post}
                isReplyPost={false}
                currentUserId='member1'
            />,
        );
        await waitFor(() => getByTestId('calendar.meeting_post.cancel'));
        fireEvent.press(getByTestId('calendar.meeting_post.cancel'));

        const scopeCall = jest.mocked(Alert.alert).mock.calls[0];
        const buttons = scopeCall[2];
        expect(buttons).toHaveLength(3);
        const thisCallButton = buttons?.[1];
        await act(async () => {
            thisCallButton?.onPress?.();
        });

        // The scope choice leads to its own confirmation.
        const confirmCall = jest.mocked(Alert.alert).mock.calls[1];
        const confirmButton = confirmCall[2]?.[1];
        await act(async () => {
            confirmButton?.onPress?.();
        });
        expect(cancelMeeting).toHaveBeenCalledWith(SERVER_URL, 'm1', 'occurrence');
    });
});
