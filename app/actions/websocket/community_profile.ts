// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchCommunityProfiles} from '@actions/remote/community_profile';
import {logDebug} from '@utils/log';

// handleCommunityProfileUpdatedEvent refetches the community's profiles whenever one of its members changes their
// nickname or picture there (the event only scopes the team, not which member or what changed).
export async function handleCommunityProfileUpdatedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const teamId: string | undefined = msg.broadcast?.team_id || msg.data?.team_id;
        if (teamId) {
            await fetchCommunityProfiles(serverUrl, teamId);
        }
    } catch (error) {
        logDebug('cannot handle community profile updated websocket event', error);
    }
}
