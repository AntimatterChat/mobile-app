// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildQueryString} from '@utils/helpers';

import {CALENDAR_PLUGIN_ID} from '../constants';

import type {
    CancelScope,
    Meeting,
    MeetingRequest,
    MeetingsResponse,
    NextMeetingResponse,
    ReminderRequest,
    RsvpRequest,
} from '../types/calendar';

// The Calendar app's REST API (F292: scheduled calls), exactly as .meetings_api_ref.md
// describes it, under /plugins/com.antimatterchat.calendar/api/v1.
export interface ClientCalendarMix {
    getMeeting: (meetingId: string) => Promise<Meeting>;
    editMeeting: (meetingId: string, request: MeetingRequest) => Promise<Meeting>;
    cancelMeeting: (meetingId: string, scope?: CancelScope) => Promise<Meeting>;
    rsvpMeeting: (meetingId: string, request: RsvpRequest) => Promise<Meeting>;
    setMeetingReminder: (meetingId: string, minutes: number | null) => Promise<Meeting>;
    getMeetingIcsRoute: (meetingId: string) => string;
    getCommunityMeetings: (teamId: string, from: number, to: number) => Promise<MeetingsResponse>;
    getNextChannelMeeting: (channelId: string) => Promise<NextMeetingResponse>;
}

const ClientCalendar = (superclass: any) => class extends superclass {
    getCalendarRoute = () => `${this.getPluginRoute(CALENDAR_PLUGIN_ID)}/api/v1`;

    getMeetingRoute = (meetingId: string) => `${this.getCalendarRoute()}/meetings/${meetingId}`;

    getMeeting = async (meetingId: string) => {
        return this.doFetch(this.getMeetingRoute(meetingId), {method: 'get'});
    };

    editMeeting = async (meetingId: string, request: MeetingRequest) => {
        return this.doFetch(this.getMeetingRoute(meetingId), {method: 'put', body: request});
    };

    cancelMeeting = async (meetingId: string, scope?: CancelScope) => {
        const query = scope ? buildQueryString({scope}) : '';
        return this.doFetch(`${this.getMeetingRoute(meetingId)}${query}`, {method: 'delete'});
    };

    rsvpMeeting = async (meetingId: string, request: RsvpRequest) => {
        return this.doFetch(`${this.getMeetingRoute(meetingId)}/rsvp`, {method: 'post', body: request});
    };

    setMeetingReminder = async (meetingId: string, minutes: number | null) => {
        return this.doFetch(`${this.getMeetingRoute(meetingId)}/reminder`, {method: 'post', body: {minutes}});
    };

    getMeetingIcsRoute = (meetingId: string) => {
        return `${this.getMeetingRoute(meetingId)}/ics`;
    };

    getCommunityMeetings = async (teamId: string, from: number, to: number) => {
        return this.doFetch(`${this.getCalendarRoute()}/meetings${buildQueryString({team_id: teamId, from, to})}`, {method: 'get'});
    };

    getNextChannelMeeting = async (channelId: string) => {
        return this.doFetch(`${this.getCalendarRoute()}/channels/${channelId}/meetings/next`, {method: 'get'});
    };
};

export default ClientCalendar;
