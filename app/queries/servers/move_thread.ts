// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineLatest, of as of$, type Observable} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import {Permissions} from '@constants';
import {grants, isThreadModerator, splitRoles, type MoveThreadTarget} from '@utils/move_thread';

import {observeMyChannelRoles, queryChannelsById, queryMyChannelsByTeam} from './channel';
import {queryRolesByNames} from './role';
import {observeMyTeamRoles} from './team';

import type {Database} from '@nozbe/watermelondb';
import type ChannelModel from '@typings/database/models/servers/channel';
import type UserModel from '@typings/database/models/servers/user';

// observeIsThreadModerator says whether user moderates the threads of channel (see isThreadModerator).
export function observeIsThreadModerator(database: Database, channel: ChannelModel | undefined, user: UserModel | undefined): Observable<boolean> {
    if (!channel || !user) {
        return of$(false);
    }
    const myChannelRoles = observeMyChannelRoles(database, channel.id);
    const myTeamRoles = channel.teamId ? observeMyTeamRoles(database, channel.teamId) : of$(undefined);

    return combineLatest([myChannelRoles, myTeamRoles]).pipe(
        switchMap(([channelRoles, teamRoles]) => {
            const names = {user: splitRoles(user.roles), team: splitRoles(teamRoles), channel: splitRoles(channelRoles)};
            return queryRolesByNames(database, [...names.user, ...names.team, ...names.channel]).observeWithColumns(['permissions']).pipe(
                switchMap((roles) => of$(isThreadModerator(roles, names))),
            );
        }),
        distinctUntilChanged(),
    );
}

// observeMoveTargets lists the channels of the community teamId that user is a member of, with whether they may post
// in each: what filterMoveTargets chooses from.
export function observeMoveTargets(database: Database, teamId: string, user: UserModel | undefined): Observable<Array<MoveThreadTarget<ChannelModel>>> {
    if (!user || !teamId) {
        return of$([]);
    }
    const myChannels = queryMyChannelsByTeam(database, teamId).observeWithColumns(['roles']);
    const myTeamRoles = observeMyTeamRoles(database, teamId);

    return combineLatest([myChannels, myTeamRoles]).pipe(
        switchMap(([memberships, teamRoles]) => {
            const userNames = splitRoles(user.roles);
            const teamNames = splitRoles(teamRoles);
            const channelNames = new Map(memberships.map((m) => [m.id, splitRoles(m.roles)]));
            const allNames = new Set([...userNames, ...teamNames, ...[...channelNames.values()].flat()]);

            return combineLatest([
                queryChannelsById(database, [...channelNames.keys()]).observeWithColumns(['display_name', 'type', 'delete_at']),
                queryRolesByNames(database, [...allNames]).observeWithColumns(['permissions']),
            ]).pipe(
                switchMap(([channels, roles]) => of$(channels.map((channel) => ({
                    channel,
                    isMember: channelNames.has(channel.id),
                    canPost: grants(roles, [...userNames, ...teamNames, ...(channelNames.get(channel.id) ?? [])], Permissions.CREATE_POST),
                })))),
            );
        }),
    );
}
