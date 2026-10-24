// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Scheduled calls (F292): the Calendar app's plugin id, its meeting post type, the
// websocket event it fires, and the fixed reminder choices, exactly as
// .meetings_api_ref.md and the Calendar app's server describe them.

export const CALENDAR_PLUGIN_ID = 'com.antimatterchat.calendar';

export const CALENDAR_MEETING_POST_TYPE = 'custom_calendar_meeting';

export const CALENDAR_MEETING_CHANGED_EVENT = `custom_${CALENDAR_PLUGIN_ID}_meeting_changed`;

// The chip (and the "next call" read) never looks further ahead than this: the server
// itself never answers a call starting later than 7 days out.
export const NEXT_CALL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// The chip switches to "in N min" during the call's last hour.
export const NEXT_CALL_SOON_WINDOW_MS = 60 * 60 * 1000;

// The chip (and the community calls screen) never reads the server more often than this.
export const MEETING_REFRESH_MIN_INTERVAL_MS = 60 * 1000;

// A call's own reminder, and a member's override of it (one of these, or absent for "Default").
export const REMINDER_MINUTES = [-1, 0, 5, 10, 15, 30, 60, 1440] as const;
export type ReminderMinutes = typeof REMINDER_MINUTES[number];

export const DEFAULT_REMINDER_MINUTES: ReminderMinutes = 10;

// The Schedule screen reads 30 days at a time.
export const UPCOMING_CALLS_PAGE_DAYS = 30;
