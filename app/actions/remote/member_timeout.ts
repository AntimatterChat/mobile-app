// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getCurrentUserId} from '@queries/servers/system';
import MemberTimeoutStore from '@store/member_timeout_store';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

// fetchMyTeamTimeout loads whether the current user is timed out of a team, and until when.
export async function fetchMyTeamTimeout(serverUrl: string, teamId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const userId = await getCurrentUserId(database);
        const timeouts = await client.getTeamTimeouts(teamId);
        const mine = timeouts?.find((t) => t.user_id === userId);
        const until = mine && mine.until > Date.now() ? mine.until : 0;
        MemberTimeoutStore.setUntil(serverUrl, teamId, until);
        return {until};
    } catch (error) {
        logDebug('error on fetchMyTeamTimeout', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
