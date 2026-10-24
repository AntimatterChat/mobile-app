// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {CALENDAR_MEETING_CHANGED_EVENT} from '../../constants';
import {calendarStore} from '../../store';

// handleCalendarEvents reacts to the Calendar app's meeting_changed websocket event. It
// carries no content (just the meeting and channel ids): what the caller may see is always
// decided by reading the server again, so this only signals the store; chips, posts and the
// Schedule/Day/Week screen each read again if they're showing that call, that channel, or
// the community's calls.
export function handleCalendarEvents(serverUrl: string, msg: WebSocketMessage) {
    if (msg.event !== CALENDAR_MEETING_CHANGED_EVENT) {
        return;
    }

    const data = msg.data as {id?: string; channel_id?: string} | undefined;
    if (!data?.id || !data?.channel_id) {
        return;
    }

    calendarStore.emitChanged(serverUrl, data.id, data.channel_id);
}

// handleCalendarReconnect clears the cached "next call" chips: they're re-read lazily by
// the components that show them (same as a channel switch), and a stale value would
// otherwise survive until the next meeting_changed.
export async function handleCalendarReconnect(serverUrl: string) {
    calendarStore.clear(serverUrl);
}
