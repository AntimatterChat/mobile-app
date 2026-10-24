// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The shapes of the Calendar app's REST API the mobile app uses, exactly as
// .meetings_api_ref.md (and the Calendar app's server) describe them. Times are
// milliseconds since the epoch (UTC).

import type {ReminderMinutes} from '../constants';

export type RsvpStatus = 'going' | 'maybe' | 'no';

export type Rsvp = {
    status: RsvpStatus;
    updated_at: number;
};

export type NextRsvp = Rsvp & {
    occurrence_start: number;
};

// A call scheduled for everyone in a channel (GET /meetings/{id}).
export type Meeting = {
    id: string;
    channel_id: string;
    team_id: string;
    post_id: string;
    organizer_id: string;
    summary: string;
    description: string;
    start: number;
    end: number;
    time_zone?: string;
    recurrence_rule?: string;
    exception_dates?: number[];
    posted_occurrence_start?: number;
    posted_occurrence_end?: number;
    next_start?: number;
    next_end?: number;
    reminder_minutes: ReminderMinutes;
    my_reminder_override?: ReminderMinutes;
    sequence: number;
    cancelled: boolean;
    created_at: number;
    updated_at: number;
    rsvps?: Record<string, Rsvp>;
    next_rsvps?: Record<string, NextRsvp>;
    my_rsvp?: RsvpStatus;
    my_rsvp_next_only?: boolean;
    can_cancel: boolean;
};

// The body of POST /channels/{channel_id}/meetings and PUT /meetings/{id}.
export type MeetingRequest = {
    summary: string;
    description: string;
    start: number;
    end: number;
    time_zone: string;
    recurrence_rule: string;
    reminder_minutes: ReminderMinutes;
};

export type CancelScope = 'occurrence' | undefined;

export type RsvpScope = 'next' | undefined;

export type RsvpRequest = {
    status: RsvpStatus;
    scope?: RsvpScope;
};

export type ReminderRequest = {
    minutes: ReminderMinutes | null;
};

// One occurrence of the community's calls (GET /meetings).
export type MeetingOccurrence = {
    meeting_id: string;
    post_id: string;
    channel_id: string;
    channel_name: string;
    channel_display_name: string;
    channel_type: string;
    organizer_id: string;
    summary: string;
    start: number;
    end: number;
    recurring: boolean;
    my_rsvp?: RsvpStatus;
};

export type MeetingsResponse = {
    occurrences: MeetingOccurrence[];
    truncated: boolean;
};

// The channel header chip's own read (GET /channels/{channel_id}/meetings/next).
export type NextMeeting = {
    meeting_id: string;
    post_id: string;
    summary: string;
    start: number;
    end: number;
    live: boolean;
    recurring: boolean;
};

export type NextMeetingResponse = {
    next: NextMeeting | null;
};
