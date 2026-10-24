// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {of as of$, combineLatest} from 'rxjs';
import {map, mergeMap, switchMap} from 'rxjs/operators';

import {General, Permissions, Preferences} from '@constants';
import {withServerUrl} from '@context/server';
import {getDisplayNamePreferenceAsBool} from '@helpers/api/preference';
import {observeChannel} from '@queries/servers/channel';
import {observeCommunityLook, observeCommunityRoles} from '@queries/servers/community_groups';
import {observeCommunityAvatarSource, observeCommunityNickname} from '@queries/servers/community_profile';
import {observeCustomProfileAttributesByUserId, observeCustomProfileFields} from '@queries/servers/custom_profile';
import {observeCustomProfileAttributesEnabled} from '@queries/servers/features';
import {queryDisplayNamePreferences} from '@queries/servers/preference';
import {observeCanManageChannelMembers, observePermissionForChannel, observePermissionForTeam} from '@queries/servers/role';
import {observeConfigBooleanValue, observeCurrentTeamId, observeCurrentUserId} from '@queries/servers/system';
import {observeTeam} from '@queries/servers/team';
import {observeTeammateNameDisplay, observeCurrentUser, observeUser, observeUserIsChannelAdmin, observeUserIsTeamAdmin} from '@queries/servers/user';
import {isDefaultChannel} from '@utils/channel';
import {isSystemAdmin, sortCustomProfileAttributes, convertToAttributesMap, convertProfileAttributesToCustomAttributes, getUserIdFromChannelName} from '@utils/user';

import UserProfile from './user_profile';

import type {CustomAttribute} from '@typings/api/custom_profile_attributes';
import type {WithDatabaseArgs} from '@typings/database/database';
import type {AvailableScreens} from '@typings/screens/navigation';

export type UserProfileProps = {
    userId: string;
    channelId?: string;
    location?: AvailableScreens;
    userIconOverride?: string;
    usernameOverride?: string;
}
type EnhancedProps = UserProfileProps & WithDatabaseArgs & {serverUrl: string}

type DMChannelInfo = {
    name: string;
    type: string;
};

export function isDirectMessageWithViewedUser(channel: DMChannelInfo|undefined, currentUserId: string, viewedUserId: string|undefined): boolean {
    if (!channel || channel.type !== General.DM_CHANNEL || !viewedUserId) {
        return false;
    }

    const dmUserId = getUserIdFromChannelName(currentUserId, channel.name);
    return Boolean(dmUserId) && dmUserId === viewedUserId;
}

function eitherPermissionGranted([a, b]: [boolean, boolean]): boolean {
    return a || b;
}

const enhanced = withObservables([], ({channelId, database, serverUrl, userId}: EnhancedProps) => {
    const currentUser = observeCurrentUser(database);
    const currentUserId = observeCurrentUserId(database);
    const channel = channelId ? observeChannel(database, channelId) : of$(undefined);
    const user = observeUser(database, userId);
    const teammateDisplayName = observeTeammateNameDisplay(database);
    const isChannelAdmin = channelId ? observeUserIsChannelAdmin(database, userId, channelId) : of$(false);
    const isDC = channel ? channel.pipe(
        switchMap((c) => of$(isDefaultChannel(c))),
    ) : of$(false);
    const isDirectMessageWithUser = combineLatest([channel, currentUserId, user]).pipe(
        map(([c, currentId, viewedUser]) => isDirectMessageWithViewedUser(c, currentId, viewedUser?.id)),
    );
    const teamId = channel.pipe(switchMap((c) => (c?.teamId ? of$(c.teamId) : observeCurrentTeamId(database))));
    const communityLook = observeCommunityLook(serverUrl, teamId, userId, user);
    const communityRoles = observeCommunityRoles(serverUrl, teamId, userId);

    // Unlike communityLook/communityRoles above, the nickname and picture never fall back to the current team for
    // a direct/group message (no channelId, or a channel with no team of its own): they stay the global profile
    // there, so these are keyed on channelId directly rather than the already-defaulted teamId.
    const communityNickname = channelId ? observeCommunityNickname(database, serverUrl, channelId, userId) : of$(undefined);
    const communityAvatarSource = channelId ? observeCommunityAvatarSource(database, serverUrl, channelId, userId) : of$(undefined);
    const isTeamAdmin = teamId.pipe(switchMap((id) => observeUserIsTeamAdmin(database, userId, id)));
    const systemAdmin = user.pipe(switchMap((u) => of$(u?.roles ? isSystemAdmin(u.roles) : false)));
    const enablePostIconOverride = observeConfigBooleanValue(database, 'EnablePostIconOverride');
    const enablePostUsernameOverride = observeConfigBooleanValue(database, 'EnablePostUsernameOverride');
    const preferences = queryDisplayNamePreferences(database).
        observeWithColumns(['value']);
    const isMilitaryTime = preferences.pipe(map((prefs) => getDisplayNamePreferenceAsBool(prefs, Preferences.USE_MILITARY_TIME)));
    const isCustomStatusEnabled = observeConfigBooleanValue(database, 'EnableCustomUserStatuses');
    const enableCustomAttributes = observeCustomProfileAttributesEnabled(database);

    // Custom profile attributes
    const rawCustomAttributes = observeCustomProfileAttributesByUserId(database, userId);

    const customFields = observeCustomProfileFields(database);

    // Convert attributes to the format expected by the component
    const formattedCustomAttributes = combineLatest([rawCustomAttributes, customFields, enableCustomAttributes]).pipe(
        mergeMap(([attributes, fields, enabled]) => {
            if (!enabled || !attributes?.length) {
                return of$([] as CustomAttribute[]);
            }
            return of$(convertProfileAttributesToCustomAttributes(attributes, fields, sortCustomProfileAttributes, true));
        }),
        mergeMap((converted) => of$(convertToAttributesMap(converted))),
    );

    // can remove member
    const canManageAndRemoveMembers = combineLatest([channel, currentUser]).pipe(
        switchMap(([c, u]) => (c && u ? observeCanManageChannelMembers(database, c.id, u) : of$(false))));

    const canChangeMemberRoles = combineLatest([channel, currentUser, canManageAndRemoveMembers]).pipe(
        switchMap(([c, u, m]) => (of$(c?.id) && of$(u) && of$(m) && observePermissionForChannel(database, c, u, Permissions.MANAGE_CHANNEL_ROLES, true))));

    // canResetCommunityProfile: whether this session may reset someone else's community nickname/picture, matching
    // the server's own check (CheckCanModerateMember: manage_team or remove_user_from_team, never on yourself or a
    // team admin). This is a community-wide (team) permission, unlike canManageAndRemoveMembers above, which is
    // scoped to the current channel, so the two can disagree.
    const team = teamId.pipe(switchMap((id) => observeTeam(database, id)));
    const canResetCommunityProfile = combineLatest([team, currentUser, currentUserId, isTeamAdmin]).pipe(
        switchMap(([t, cu, cuId, targetIsTeamAdmin]) => {
            if (!t || !cu || cuId === userId || targetIsTeamAdmin) {
                return of$(false);
            }
            return combineLatest([
                observePermissionForTeam(database, t, cu, Permissions.MANAGE_TEAM, false),
                observePermissionForTeam(database, t, cu, Permissions.REMOVE_USER_FROM_TEAM, false),
            ]).pipe(map(eitherPermissionGranted));
        }),
    );

    return {
        canManageAndRemoveMembers,
        canResetCommunityProfile,
        communityLook,
        communityRoles,
        communityNickname,
        communityAvatarSource,
        currentUserId,
        enablePostIconOverride,
        enablePostUsernameOverride,
        isChannelAdmin,
        isCustomStatusEnabled,
        isDefaultChannel: isDC,
        isDirectMessageWithUser,
        isMilitaryTime,
        isSystemAdmin: systemAdmin,
        isTeamAdmin,
        teamId,
        teammateDisplayName,
        user,
        canChangeMemberRoles,
        hideGuestTags: observeConfigBooleanValue(database, 'HideGuestTags'),
        enableCustomAttributes,
        customAttributesSet: formattedCustomAttributes,
    };
});

export default withDatabase(withServerUrl(enhanced(UserProfile)));

