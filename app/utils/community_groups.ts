// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Antimatter calls a Mattermost team a community. Its custom user groups are of two kinds:
// - teams (is_team): a short tag shown next to their members' names, a lead and a team channel. In each community,
//   each person picks the team whose tag they show; the choice is kept in their user props (team_badge), as a JSON
//   object of community id to team id.
// - roles (the others): a colour for their members' names, an icon and a place among the community's roles
//   (0 = highest). A person's name takes the colour of their highest coloured role, unless the community hides
//   role colours.
// These helpers follow the web app's (fusion/teams/teams.ts and roles.ts).

export const TEAM_BADGE_PROP = 'team_badge';

export type CommunityGroup = {
    id: string;
    name: string;
    display_name: string;
    description: string;
    source: string;
    delete_at: number;
    team_id?: string;
    is_team?: boolean;
    tag?: string;
    color?: string;
    icon?: string;
    position?: number;
    hoist?: boolean;
    lead_id?: string;
    channel_id?: string;
    self_assignable?: boolean;
    member_count?: number;
    member_ids?: string[];
};

// What a community (a Mattermost team) says about its roles and badges.
export type CommunitySettings = {
    hideRoleColors: boolean;
    requireTeamBadges: boolean;
};

export type CommunityGroupsState = {
    groups: Record<string, CommunityGroup>;
    communities: Record<string, CommunitySettings>;
};

export const EMPTY_COMMUNITY_GROUPS: CommunityGroupsState = {groups: {}, communities: {}};

function isCommunityGroup(group: CommunityGroup) {
    return group.source === 'custom' && !group.delete_at && Boolean(group.team_id);
}

// isTeam tells a team from a role and from Mattermost's own custom groups.
export function isTeam(group: CommunityGroup) {
    return isCommunityGroup(group) && Boolean(group.is_team);
}

export function isRole(group: CommunityGroup) {
    return isCommunityGroup(group) && !group.is_team;
}

function byPosition(a: CommunityGroup, b: CommunityGroup) {
    return ((a.position ?? 0) - (b.position ?? 0)) || a.display_name.localeCompare(b.display_name);
}

function byName(a: CommunityGroup, b: CommunityGroup) {
    return a.display_name.localeCompare(b.display_name);
}

// userTeams lists the teams of a community someone belongs to, by name.
export function userTeams(state: CommunityGroupsState, communityId: string, userId: string) {
    return Object.values(state.groups).
        filter((g) => isTeam(g) && g.team_id === communityId && g.member_ids?.includes(userId)).
        sort(byName);
}

// userRoles lists someone's roles in a community, highest first.
export function userRoles(state: CommunityGroupsState, communityId: string, userId: string) {
    return Object.values(state.groups).
        filter((g) => isRole(g) && g.team_id === communityId && g.member_ids?.includes(userId)).
        sort(byPosition);
}

// badgeChoice is the team someone chose to show in a community, if any. The prop used to keep a single team id, from
// when teams belonged to the whole server: such a choice is returned as is, and only matches a team of its community.
export function badgeChoice(props: UserProps | null | undefined, communityId: string): string | undefined {
    const value = props?.[TEAM_BADGE_PROP];
    if (!value || typeof value !== 'string') {
        return undefined;
    }
    if (!value.startsWith('{')) {
        return value;
    }
    try {
        const choices = JSON.parse(value);
        const chosen = choices && typeof choices === 'object' && !Array.isArray(choices) ? choices[communityId] : undefined;
        return typeof chosen === 'string' && chosen ? chosen : undefined;
    } catch {
        return undefined;
    }
}

// badgeTeam is the team whose tag someone shows in a community: the one they chose, if they still belong to it and it
// has a tag. Where the community requires badges, someone who chose none shows their first team's tag.
export function badgeTeam(state: CommunityGroupsState, communityId: string, userId: string, props: UserProps | null | undefined) {
    const tagged = userTeams(state, communityId, userId).filter((t) => t.tag);
    const chosen = badgeChoice(props, communityId);
    const required = Boolean(state.communities[communityId]?.requireTeamBadges);
    return tagged.find((t) => t.id === chosen) ?? (required ? tagged[0] : undefined);
}

// roleColor is the colour of someone's highest coloured role in a community, when it shows role colours.
export function roleColor(state: CommunityGroupsState, communityId: string, userId: string) {
    if (state.communities[communityId]?.hideRoleColors) {
        return undefined;
    }
    return userRoles(state, communityId, userId).find((r) => r.color)?.color || undefined;
}

// withGroup is the state once the server sends a group: a group without its members keeps those already known, and
// a deleted one goes.
export function withGroup(state: CommunityGroupsState, group: CommunityGroup): CommunityGroupsState {
    const groups = {...state.groups};
    if (group.delete_at) {
        delete groups[group.id];
    } else {
        groups[group.id] = {...group, member_ids: group.member_ids ?? state.groups[group.id]?.member_ids};
    }
    return {...state, groups};
}

export function communitySettingsOf(team: Partial<Team> & {hide_role_colors?: boolean; require_team_badges?: boolean}): CommunitySettings {
    return {
        hideRoleColors: Boolean(team.hide_role_colors),
        requireTeamBadges: Boolean(team.require_team_badges),
    };
}
