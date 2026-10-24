// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {HTTP_CONFLICT} from '@constants/network';
import NetworkManager from '@managers/network_manager';
import {setCommunityRules} from '@store/community_rules_store';
import {getFullErrorMessage, isErrorWithStatusCode} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

// fetchCommunityRules loads a community's rules and, for the current member, whether they still have to agree to
// them before they can post.
export async function fetchCommunityRules(serverUrl: string, teamId: string): Promise<{rules?: CommunityRules; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const rules = await client.getCommunityRules(teamId);
        setCommunityRules(serverUrl, rules);
        return {rules};
    } catch (error) {
        logDebug('error on fetchCommunityRules', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// acceptCommunityRules agrees to the version of the rules the member was shown. A 409 means the rules changed since
// they were shown (the server refused a stale acceptance): the caller should show the refreshed text and ask again.
export async function acceptCommunityRules(serverUrl: string, teamId: string, version: number): Promise<{rules?: CommunityRules; error?: unknown; changed?: boolean}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const rules = await client.acceptCommunityRules(teamId, version);
        setCommunityRules(serverUrl, rules);
        return {rules};
    } catch (error) {
        logDebug('error on acceptCommunityRules', getFullErrorMessage(error));
        if (isErrorWithStatusCode(error) && error.status_code === HTTP_CONFLICT) {
            await fetchCommunityRules(serverUrl, teamId);
            return {error, changed: true};
        }
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}
