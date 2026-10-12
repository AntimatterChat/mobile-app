// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineLatest, of as of$, type Observable} from 'rxjs';
import {distinctUntilChanged, map, switchMap} from 'rxjs/operators';

import {observeChannel} from '@queries/servers/channel';
import {observeCurrentTeamId} from '@queries/servers/system';
import {observeCommunityGroups} from '@store/community_groups_store';
import {badgeTeam, roleColor, userRoles, type CommunityGroup} from '@utils/community_groups';

import type {Database} from '@nozbe/watermelondb';
import type UserModel from '@typings/database/models/servers/user';

export type CommunityLook = {

    // The colour of the person's highest coloured role, for their name.
    roleColor?: string;

    // The team whose tag they show next to their name.
    badge?: CommunityGroup;
};

const sameLook = (a: CommunityLook, b: CommunityLook) => (
    a.roleColor === b.roleColor && a.badge === b.badge
);

// observeCommunityOfChannel is the community a conversation belongs to: its team, else (direct and group messages)
// the current one.
export const observeCommunityOfChannel = (database: Database, channelId: string): Observable<string> => {
    return observeChannel(database, channelId).pipe(
        switchMap((c) => (c?.teamId ? of$(c.teamId) : observeCurrentTeamId(database))),
        distinctUntilChanged(),
    );
};

// observeCommunityLook is how someone's name shows in a community: in their role's colour, with their team's tag.
export const observeCommunityLook = (serverUrl: string, communityId: Observable<string>, userId: string, user: Observable<UserModel | undefined>): Observable<CommunityLook> => {
    return combineLatest([observeCommunityGroups(serverUrl), communityId, user]).pipe(
        map(([state, id, u]) => ({
            roleColor: roleColor(state, id, userId),
            badge: badgeTeam(state, id, userId, u?.props),
        })),
        distinctUntilChanged(sameLook),
    );
};

// observeCommunityRoles lists someone's roles in a community, highest first.
export const observeCommunityRoles = (serverUrl: string, communityId: Observable<string>, userId: string): Observable<CommunityGroup[]> => {
    return combineLatest([observeCommunityGroups(serverUrl), communityId]).pipe(
        map(([state, id]) => userRoles(state, id, userId)),
        distinctUntilChanged((a, b) => a.length === b.length && a.every((r, i) => r === b[i])),
    );
};
