// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: a community's rules, which members must agree to before they can post in its channels. See
// server/public/model/community_rules.go and api4/community_rules.go.
type CommunityRules = {
    team_id: string;
    enabled: boolean;
    text: string;
    version: number;
    updated_by: string;
    update_at: number;

    // accepted_version and must_accept are filled in for the requesting member only: the server never stores them.
    accepted_version: number;
    must_accept: boolean;
};
