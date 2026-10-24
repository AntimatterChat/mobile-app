// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a member's own nickname and picture in one community, shown there instead of their global ones. See
// server/public/model/community_profile.go and api4/community_profile.go.
type CommunityProfile = {
    team_id: string;
    user_id: string;
    nickname?: string;

    // avatar_update_at is 0 when the member has no picture set for this community (their global one shows).
    avatar_update_at?: number;
    update_at: number;
};

// CommunityProfilePatch is the PATCH body: an empty string removes the nickname.
type CommunityProfilePatch = {
    nickname: string;
};

// CommunityProfileReset is the POST .../reset body: which of the member's own community settings to clear.
type CommunityProfileReset = {
    nickname?: boolean;
    avatar?: boolean;
};
