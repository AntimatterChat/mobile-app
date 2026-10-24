// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type ClientBase from './base';

export interface ClientCommunityProfileMix {
    getCommunityProfileRoute: (teamId: string, userId: string) => string;
    getCommunityProfiles: (teamId: string) => Promise<CommunityProfile[]>;
    patchCommunityProfile: (teamId: string, userId: string, patch: CommunityProfilePatch) => Promise<CommunityProfile>;
    resetCommunityProfile: (teamId: string, userId: string, reset: CommunityProfileReset) => Promise<CommunityProfile>;
    getCommunityAvatarUrl: (teamId: string, userId: string, avatarUpdateAt: number) => string;
}

const ClientCommunityProfile = <TBase extends Constructor<ClientBase>>(superclass: TBase) => class extends superclass {
    getCommunityProfileRoute = (teamId: string, userId: string) => {
        return `${this.getTeamMemberRoute(teamId, userId)}/profile`;
    };

    getCommunityProfiles = async (teamId: string) => {
        return this.doFetch(
            `${this.getTeamRoute(teamId)}/profiles`,
            {method: 'get'},
        );
    };

    patchCommunityProfile = async (teamId: string, userId: string, patch: CommunityProfilePatch) => {
        return this.doFetch(
            this.getCommunityProfileRoute(teamId, userId),
            {method: 'patch', body: patch},
        );
    };

    resetCommunityProfile = async (teamId: string, userId: string, reset: CommunityProfileReset) => {
        return this.doFetch(
            `${this.getCommunityProfileRoute(teamId, userId)}/reset`,
            {method: 'post', body: reset},
        );
    };

    // getCommunityAvatarUrl is read-only: changing the picture goes through uploadCommunityAvatar
    // (app/actions/remote/community_profile.ts), which uploads it like the global profile picture.
    getCommunityAvatarUrl = (teamId: string, userId: string, avatarUpdateAt: number) => {
        return `${this.apiClient.baseUrl}${this.getCommunityProfileRoute(teamId, userId)}/image?_=${avatarUpdateAt}`;
    };
};

export default ClientCommunityProfile;
