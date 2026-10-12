// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchMyTeamTimeout} from '@actions/remote/member_timeout';

// Antimatter tells a team's members when its timeouts change.
export const MEMBER_TIMEOUTS_UPDATED = 'member_timeouts_updated';

export function handleModerationEvents(serverUrl: string, msg: WebSocketMessage) {
    if (msg.event !== MEMBER_TIMEOUTS_UPDATED) {
        return;
    }
    const teamId = msg.data?.team_id || msg.broadcast?.team_id;
    if (teamId) {
        fetchMyTeamTimeout(serverUrl, teamId);
    }
}
