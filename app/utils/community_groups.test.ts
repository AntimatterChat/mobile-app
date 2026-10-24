// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    EMPTY_COMMUNITY_GROUPS,
    badgeChoice,
    badgeTeam,
    communityDefaultChannelId,
    communitySettingsOf,
    isAllChannelsCommunity,
    isWorkspaceCommunity,
    roleColor,
    userRoles,
    withGroup,
    type CommunityGroup,
    type CommunityGroupsState,
} from './community_groups';

const community = 'community1';
const other = 'community2';

function group(id: string, fields: Partial<CommunityGroup>): CommunityGroup {
    return {id, name: id, display_name: id, description: '', source: 'custom', delete_at: 0, team_id: community, member_ids: ['u1'], ...fields};
}

function stateOf(groups: CommunityGroup[], communities: CommunityGroupsState['communities'] = {}): CommunityGroupsState {
    return {groups: Object.fromEntries(groups.map((g) => [g.id, g])), communities};
}

describe('community groups', () => {
    const alpha = group('alpha', {is_team: true, tag: 'ALP', display_name: 'Alpha'});
    const beta = group('beta', {is_team: true, tag: 'BET', display_name: 'Beta'});
    const untagged = group('aaa', {is_team: true, tag: '', display_name: 'Aaa'});
    const elsewhere = group('elsewhere', {is_team: true, tag: 'ELS', team_id: other});

    describe('badgeChoice', () => {
        it('should read the choice for the community from the JSON map', () => {
            expect(badgeChoice({team_badge: JSON.stringify({[community]: 'beta', [other]: 'elsewhere'})}, community)).toBe('beta');
            expect(badgeChoice({team_badge: JSON.stringify({[other]: 'elsewhere'})}, community)).toBeUndefined();
        });

        it('should return an old single choice as is', () => {
            expect(badgeChoice({team_badge: 'beta'}, community)).toBe('beta');
        });

        it('should ignore a broken prop', () => {
            expect(badgeChoice({team_badge: '{oops'}, community)).toBeUndefined();
            expect(badgeChoice(null, community)).toBeUndefined();
        });
    });

    describe('badgeTeam', () => {
        const state = stateOf([alpha, beta, untagged, elsewhere]);

        it('should show the chosen team of the community', () => {
            expect(badgeTeam(state, community, 'u1', {team_badge: JSON.stringify({[community]: 'beta'})})).toBe(beta);
        });

        it('should show nothing without a choice, or for a team of another community or one left', () => {
            expect(badgeTeam(state, community, 'u1', {})).toBeUndefined();
            expect(badgeTeam(state, community, 'u1', {team_badge: 'elsewhere'})).toBeUndefined();
            expect(badgeTeam(state, community, 'u2', {team_badge: 'beta'})).toBeUndefined();
        });

        it('should show the first tagged team where the community requires badges', () => {
            const required = stateOf([alpha, beta, untagged], {[community]: {hideRoleColors: false, requireTeamBadges: true}});
            expect(badgeTeam(required, community, 'u1', {})).toBe(alpha);
        });
    });

    describe('roles', () => {
        const mods = group('mods', {color: '#e67e22', position: 1, display_name: 'Moderators'});
        const lead = group('lead', {color: '', position: 0, display_name: 'Lead'});
        const fans = group('fans', {color: '#3498db', position: 2, display_name: 'Fans'});
        const gone = group('gone', {color: '#000000', position: 0, delete_at: 5});
        const state = stateOf([fans, mods, lead, gone, alpha]);

        it('should list someone\'s roles, highest first, without teams or deleted roles', () => {
            expect(userRoles(state, community, 'u1')).toEqual([lead, mods, fans]);
        });

        it('should colour a name with the highest coloured role', () => {
            expect(roleColor(state, community, 'u1')).toBe('#e67e22');
            expect(roleColor(state, other, 'u1')).toBeUndefined();
        });

        it('should not colour names where the community hides role colours', () => {
            const hidden = {...state, communities: {[community]: {hideRoleColors: true, requireTeamBadges: false}}};
            expect(roleColor(hidden, community, 'u1')).toBeUndefined();
        });
    });

    describe('communitySettingsOf', () => {
        it('should read the kind, all-channels membership and default/Welcome channels off the team', () => {
            const settings = communitySettingsOf({
                kind: 'workspace',
                all_channels_membership: true,
                default_channel_id: 'default1',
                welcome_channel_id: 'welcome1',
            });
            expect(settings.isWorkspace).toBe(true);
            expect(settings.allChannelsMembership).toBe(true);
            expect(settings.defaultChannelId).toBe('default1');
            expect(settings.welcomeChannelId).toBe('welcome1');
        });

        it('should default to a guild with no configured channels when the team has none of those fields', () => {
            const settings = communitySettingsOf({});
            expect(settings.isWorkspace).toBe(false);
            expect(settings.allChannelsMembership).toBe(false);
            expect(settings.defaultChannelId).toBeUndefined();
            expect(settings.welcomeChannelId).toBeUndefined();
        });
    });

    describe('isWorkspaceCommunity and isAllChannelsCommunity', () => {
        const state = stateOf([], {
            [community]: {hideRoleColors: false, requireTeamBadges: false, isWorkspace: true, allChannelsMembership: false},
            [other]: {hideRoleColors: false, requireTeamBadges: false, isWorkspace: false, allChannelsMembership: true},
        });

        it('should tell a workspace community from a guild one', () => {
            expect(isWorkspaceCommunity(state, community)).toBe(true);
            expect(isWorkspaceCommunity(state, other)).toBe(false);
            expect(isWorkspaceCommunity(state, 'unknown')).toBe(false);
        });

        it('should tell an all-channels-membership community', () => {
            expect(isAllChannelsCommunity(state, community)).toBe(false);
            expect(isAllChannelsCommunity(state, other)).toBe(true);
        });
    });

    describe('communityDefaultChannelId', () => {
        it('should read the configured default channel, when the community set one', () => {
            const state = stateOf([], {[community]: {hideRoleColors: false, requireTeamBadges: false, defaultChannelId: 'default1'}});
            expect(communityDefaultChannelId(state, community)).toBe('default1');
            expect(communityDefaultChannelId(state, other)).toBeUndefined();
        });
    });

    describe('withGroup', () => {
        it('should keep the known members of a group sent without them, and drop a deleted group', () => {
            const state = stateOf([alpha]);
            const renamed = withGroup(state, {...alpha, display_name: 'Alpha 2', member_ids: undefined});
            expect(renamed.groups.alpha.display_name).toBe('Alpha 2');
            expect(renamed.groups.alpha.member_ids).toEqual(['u1']);

            const deleted = withGroup(renamed, {...alpha, delete_at: 10});
            expect(deleted.groups).toEqual({});
            expect(EMPTY_COMMUNITY_GROUPS.groups).toEqual({});
        });
    });
});
