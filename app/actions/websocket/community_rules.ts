// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchCommunityRules} from '@actions/remote/community_rules';
import {getCommunityRules, setCommunityRules} from '@store/community_rules_store';
import {logDebug} from '@utils/log';

// handleCommunityRulesUpdatedEvent refetches a community's rules whenever an admin changes them: the event only
// carries whether they're enabled and their version, not the text, so a refetch is the simplest correct way to
// pick up the new text and this member's must_accept flag.
export async function handleCommunityRulesUpdatedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const teamId: string | undefined = msg.data?.team_id;
        if (teamId) {
            await fetchCommunityRules(serverUrl, teamId);
        }
    } catch (error) {
        logDebug('cannot handle community rules updated websocket event', error);
    }
}

// handleCommunityRulesAcceptedEvent is sent to the member themself, confirming their own acceptance went through
// (e.g. from another device): it updates the cached accepted_version without a round trip.
export async function handleCommunityRulesAcceptedEvent(serverUrl: string, msg: WebSocketMessage) {
    try {
        const teamId: string | undefined = msg.data?.team_id;
        const version: number | undefined = msg.data?.version;
        if (!teamId || typeof version !== 'number') {
            return;
        }
        const existing = getCommunityRules(serverUrl, teamId);
        if (existing) {
            setCommunityRules(serverUrl, {...existing, accepted_version: version, must_accept: false});
        }
    } catch (error) {
        logDebug('cannot handle community rules accepted websocket event', error);
    }
}
