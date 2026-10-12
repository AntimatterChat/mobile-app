// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// The Antimatter plugins whose posts and actions the app supports natively.

export const POLLS_PLUGIN_ID = 'com.antimatterchat.polls';
export const NOTES_PLUGIN_ID = 'com.antimatterchat.notes';
export const WHITEBOARD_PLUGIN_ID = 'com.antimatterchat.whiteboard';
export const GIFS_PLUGIN_ID = 'com.antimatterchat.gifs';
export const TODO_PLUGIN_ID = 'com.mattermost.plugin-todo';

export const AM_PLUGIN_POST_TYPES = {
    POLL: 'custom_poll',
    NOTE: 'custom_antimatter_note',
    WHITEBOARD: 'custom_am_whiteboard',
    TODO: 'custom_todo',
    GIF: 'custom_antimatter_gif',
} as const;

export const AM_PLUGIN_WEBSOCKET_EVENTS = {
    POLL_UPDATED: `custom_${POLLS_PLUGIN_ID}_poll_updated`,
    POLL_MY_VOTES: `custom_${POLLS_PLUGIN_ID}_poll_my_votes`,
    TODO_REFRESH: `custom_${TODO_PLUGIN_ID}_refresh`,
} as const;

// The limits of a poll, as the plugin's server checks them (server/poll.go).
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 10;
export const POLL_MAX_QUESTION_LENGTH = 200;
export const POLL_MAX_OPTION_LENGTH = 80;

// The durations offered when creating a poll, in minutes (0: no end), as in the plugin's dialog.
export const POLL_DURATIONS = [60, 8 * 60, 24 * 60, 3 * 24 * 60, 7 * 24 * 60, 0];
export const POLL_DEFAULT_DURATION = 24 * 60;
