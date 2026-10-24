// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getCurrentUser} from '@queries/servers/user';
import {setCommunityProfile, setCommunityProfiles} from '@store/community_profile_store';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {forceLogoutIfNecessary} from './session';

// fetchCommunityProfiles loads everyone's own nickname and picture in one community, for showing in its channels
// and member lists.
export async function fetchCommunityProfiles(serverUrl: string, teamId: string): Promise<{profiles?: CommunityProfile[]; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const profiles = await client.getCommunityProfiles(teamId);
        setCommunityProfiles(serverUrl, teamId, profiles);
        return {profiles};
    } catch (error) {
        logDebug('error on fetchCommunityProfiles', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// patchCommunityProfile sets the current member's own nickname for one community. An empty nickname removes it.
export async function patchCommunityProfile(serverUrl: string, teamId: string, nickname: string): Promise<{profile?: CommunityProfile; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const currentUser = await getCurrentUser(database);
        if (!currentUser) {
            return {error: 'no current user'};
        }

        const profile = await client.patchCommunityProfile(teamId, currentUser.id, {nickname});
        setCommunityProfile(serverUrl, profile);
        return {profile};
    } catch (error) {
        logDebug('error on patchCommunityProfile', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// resetCommunityProfile clears the current member's own nickname and/or picture for one community, bringing back
// their global ones there.
export async function resetCommunityProfile(serverUrl: string, teamId: string, reset: CommunityProfileReset): Promise<{profile?: CommunityProfile; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const currentUser = await getCurrentUser(database);
        if (!currentUser) {
            return {error: 'no current user'};
        }

        const profile = await client.resetCommunityProfile(teamId, currentUser.id, reset);
        setCommunityProfile(serverUrl, profile);
        return {profile};
    } catch (error) {
        logDebug('error on resetCommunityProfile', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// uploadCommunityAvatar sets the current member's own picture for one community, the same way the global profile
// picture is uploaded (app/actions/remote/user.ts's uploadUserProfileImage).
export async function uploadCommunityAvatar(serverUrl: string, teamId: string, localPath: string): Promise<{profile?: CommunityProfile; error?: unknown}> {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const currentUser = await getCurrentUser(database);
        if (!currentUser) {
            return {error: 'no current user'};
        }

        const endpoint = `${client.getCommunityProfileRoute(teamId, currentUser.id)}/image`;
        const response = await client.apiClient.upload(endpoint, localPath, {
            skipBytes: 0,
            method: 'POST',
            multipart: {
                fileKey: 'image',
            },
            headers: client.getRequestHeaders('POST'),
        });

        const profile = response.data as unknown as CommunityProfile;
        setCommunityProfile(serverUrl, profile);
        return {profile};
    } catch (error) {
        logDebug('error on uploadCommunityAvatar', getFullErrorMessage(error));
        return {error};
    }
}
