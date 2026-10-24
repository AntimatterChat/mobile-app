// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter: someone timed out of a team, who can read its channels but not post or react in them until then.
type MemberTimeout = {
    team_id: string;
    user_id: string;
    until: number;
    reason: string;
    created_by: string;
    create_at: number;
};

type TeamMembership = {
    id?: string;
    mention_count: number;
    msg_count: number;
    team_id: string;
    user_id: string;
    roles: string;
    delete_at: number;
    scheme_user: boolean;
    scheme_admin: boolean;
};

type TeamMemberWithError = {
    member: TeamMembership;
    user_id: string;
    error?: ApiError;
}

type TeamInviteWithError = {
    email: string;
    error?: ApiError;
}

type TeamType = 'O' | 'I';

// Antimatter: a community is either a guild (everyone belongs to every eligible channel, like Discord) or a
// workspace (members pick their own channels, like Slack). See server/public/model/team.go.
type TeamKind = 'guild' | 'workspace';

type Team = {
    id: string;
    create_at: number;
    update_at: number;
    delete_at: number;
    display_name: string;
    name: string;
    description: string;
    email: string;
    type: TeamType;
    company_name: string;
    allowed_domains: string;
    invite_id: string;
    allow_open_invite: boolean;
    scheme_id: string;
    group_constrained: boolean|null;
    last_team_icon_update: number;

    // Antimatter: the community's kind, its automatic channel membership, and its default and Welcome channels.
    kind?: TeamKind;
    all_channels_membership?: boolean;
    default_channel_id?: string;
    welcome_channel_id?: string;
};

type TeamsState = {
    currentTeamId: string;
    teams: Dictionary<Team>;
    myMembers: Dictionary<TeamMembership>;
    membersInTeam: any;
    stats: any;
    groupsAssociatedToTeam: any;
    totalCount: number;
};
