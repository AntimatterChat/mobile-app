// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import ClientCalendar from './rest';

describe('ClientCalendar', () => {
    const mockDoFetch = jest.fn();
    const mockGetPluginRoute = jest.fn(() => '/plugins/com.antimatterchat.calendar');

    const BaseClass = class {
        doFetch = mockDoFetch;
        getPluginRoute = mockGetPluginRoute;
    };
    const Client = ClientCalendar(BaseClass);
    const client = new Client();

    const ROUTE = '/plugins/com.antimatterchat.calendar/api/v1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getMeeting', async () => {
        await client.getMeeting('m1');
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1`, {method: 'get'});
    });

    it('editMeeting', async () => {
        const request = {summary: 'Sync', description: '', start: 1, end: 2, time_zone: 'UTC', recurrence_rule: '', reminder_minutes: 10};
        await client.editMeeting('m1', request);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1`, {method: 'put', body: request});
    });

    it('cancelMeeting without scope', async () => {
        await client.cancelMeeting('m1');
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1`, {method: 'delete'});
    });

    it('cancelMeeting with scope=occurrence', async () => {
        await client.cancelMeeting('m1', 'occurrence');
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1?scope=occurrence`, {method: 'delete'});
    });

    it('rsvpMeeting', async () => {
        await client.rsvpMeeting('m1', {status: 'going', scope: 'next'});
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1/rsvp`, {method: 'post', body: {status: 'going', scope: 'next'}});
    });

    it('setMeetingReminder with a value', async () => {
        await client.setMeetingReminder('m1', 60);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1/reminder`, {method: 'post', body: {minutes: 60}});
    });

    it('setMeetingReminder with null (Default)', async () => {
        await client.setMeetingReminder('m1', null);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings/m1/reminder`, {method: 'post', body: {minutes: null}});
    });

    it('getMeetingIcsRoute', () => {
        expect(client.getMeetingIcsRoute('m1')).toBe(`${ROUTE}/meetings/m1/ics`);
    });

    it('getCommunityMeetings', async () => {
        await client.getCommunityMeetings('team1', 1000, 2000);
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/meetings?team_id=team1&from=1000&to=2000`, {method: 'get'});
    });

    it('getNextChannelMeeting', async () => {
        await client.getNextChannelMeeting('channel1');
        expect(mockDoFetch).toHaveBeenCalledWith(`${ROUTE}/channels/channel1/meetings/next`, {method: 'get'});
    });
});
