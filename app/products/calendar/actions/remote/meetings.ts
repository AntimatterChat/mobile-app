// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {calendarStore} from '../../store';

import type {CancelScope, Meeting, MeetingRequest, MeetingsResponse, NextMeetingResponse, RsvpRequest} from '../../types/calendar';

// fetchNextChannelMeeting reads the channel header chip's own data (GET
// /channels/{channel_id}/meetings/next) and caches it in the store, so the chip (and
// anything else showing that channel) reads the same value without a second request.
export async function fetchNextChannelMeeting(serverUrl: string, channelId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: NextMeetingResponse = await client.getNextChannelMeeting(channelId);
        calendarStore.setNextMeeting(serverUrl, channelId, response.next);
        return {data: response.next};
    } catch (error) {
        logDebug('error on fetchNextChannelMeeting', getFullErrorMessage(error));
        return {error};
    }
}

export async function fetchMeeting(serverUrl: string, meetingId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const meeting: Meeting = await client.getMeeting(meetingId);
        return {data: meeting};
    } catch (error) {
        logDebug('error on fetchMeeting', getFullErrorMessage(error));
        return {error};
    }
}

export async function editMeeting(serverUrl: string, meetingId: string, request: MeetingRequest) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const meeting: Meeting = await client.editMeeting(meetingId, request);
        return {data: meeting};
    } catch (error) {
        logDebug('error on editMeeting', getFullErrorMessage(error));
        return {error};
    }
}

export async function cancelMeeting(serverUrl: string, meetingId: string, scope?: CancelScope) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const meeting: Meeting = await client.cancelMeeting(meetingId, scope);
        return {data: meeting};
    } catch (error) {
        logDebug('error on cancelMeeting', getFullErrorMessage(error));
        return {error};
    }
}

export async function rsvpMeeting(serverUrl: string, meetingId: string, request: RsvpRequest) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const meeting: Meeting = await client.rsvpMeeting(meetingId, request);
        return {data: meeting};
    } catch (error) {
        logDebug('error on rsvpMeeting', getFullErrorMessage(error));
        return {error};
    }
}

export async function setMeetingReminder(serverUrl: string, meetingId: string, minutes: number | null) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const meeting: Meeting = await client.setMeetingReminder(meetingId, minutes);
        return {data: meeting};
    } catch (error) {
        logDebug('error on setMeetingReminder', getFullErrorMessage(error));
        return {error};
    }
}

// fetchCommunityMeetings reads the Schedule/Day/Week screen's occurrences (GET /meetings).
// The server already filters by what the caller may read: this never filters client-side.
export async function fetchCommunityMeetings(serverUrl: string, teamId: string, from: number, to: number) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: MeetingsResponse = await client.getCommunityMeetings(teamId, from, to);
        return {data: response};
    } catch (error) {
        logDebug('error on fetchCommunityMeetings', getFullErrorMessage(error));
        return {error};
    }
}
