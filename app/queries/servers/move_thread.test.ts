// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {firstValueFrom} from 'rxjs';

import {General, Permissions} from '@constants';
import DatabaseManager from '@database/manager';
import TestHelper from '@test/test_helper';

import {getChannelById} from './channel';
import {observeIsThreadModerator, observeMoveTargets} from './move_thread';

import type ServerDataOperator from '@database/operator/server_data_operator';
import type {Database} from '@nozbe/watermelondb';

describe('move thread queries', () => {
    const serverUrl = 'movethread.queries.test.com';
    let database: Database;
    let operator: ServerDataOperator;

    const user = TestHelper.fakeUserModel({id: 'me', roles: 'system_user'});

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        ({database, operator} = DatabaseManager.getServerDatabaseAndOperator(serverUrl));

        await operator.handleRole({
            roles: [
                {id: 'system_user', name: 'system_user', permissions: []},
                {id: 'team_user', name: 'team_user', permissions: []},
                {id: 'team_admin', name: 'team_admin', permissions: [Permissions.MANAGE_TEAM]},
                {id: 'channel_user', name: 'channel_user', permissions: [Permissions.CREATE_POST]},
                {id: 'channel_reader', name: 'channel_reader', permissions: []},
                {id: 'channel_admin', name: 'channel_admin', permissions: [Permissions.CREATE_POST]},
            ],
            prepareRecordsOnly: false,
        });
        await operator.handleMyTeam({myTeams: [{id: 'team1', roles: 'team_user'}], prepareRecordsOnly: false});

        const channels = [
            TestHelper.fakeChannel({id: 'town', name: 'town', team_id: 'team1', type: General.OPEN_CHANNEL}),
            TestHelper.fakeChannel({id: 'ops', name: 'ops', team_id: 'team1', type: General.OPEN_CHANNEL}),
            TestHelper.fakeChannel({id: 'board', name: 'board', team_id: 'team1', type: General.PRIVATE_CHANNEL}),
            TestHelper.fakeChannel({id: 'news', name: 'news', team_id: 'team1', type: General.OPEN_CHANNEL}),
            TestHelper.fakeChannel({id: 'old', name: 'old', team_id: 'team1', type: General.OPEN_CHANNEL, delete_at: 1}),
            TestHelper.fakeChannel({id: 'elsewhere', name: 'elsewhere', team_id: 'team2', type: General.OPEN_CHANNEL}),
            TestHelper.fakeChannel({id: 'outside', name: 'outside', team_id: 'team1', type: General.OPEN_CHANNEL}),
        ];
        const memberOf = ['town', 'ops', 'board', 'news', 'old', 'elsewhere'];
        const roles: Record<string, string> = {town: 'channel_user', ops: 'channel_user', board: 'channel_user', news: 'channel_reader', old: 'channel_user', elsewhere: 'channel_user'};
        await operator.handleChannel({channels, prepareRecordsOnly: false});
        await operator.handleMyChannel({
            channels: channels.filter((c) => memberOf.includes(c.id)),
            myChannels: memberOf.map((id) => TestHelper.fakeChannelMember({id, channel_id: id, user_id: 'me', roles: roles[id]})),
            prepareRecordsOnly: false,
        });
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
    });

    it('should list the community\'s channels one is in, with whether one may post there', async () => {
        const targets = await firstValueFrom(observeMoveTargets(database, 'team1', user));
        const byId = Object.fromEntries(targets.map((t) => [t.channel.id, {isMember: t.isMember, canPost: t.canPost}]));

        // Archived channels, other communities' and channels one isn't in are left out.
        expect(Object.keys(byId).sort()).toEqual(['board', 'news', 'ops', 'town']);
        expect(byId.ops).toEqual({isMember: true, canPost: true});
        expect(byId.board).toEqual({isMember: true, canPost: true});
        expect(byId.news).toEqual({isMember: true, canPost: false});
    });

    it('should list nothing without a user or a community', async () => {
        expect(await firstValueFrom(observeMoveTargets(database, 'team1', undefined))).toEqual([]);
        expect(await firstValueFrom(observeMoveTargets(database, '', user))).toEqual([]);
    });

    it('should know a channel\'s admins and the community\'s for moderators', async () => {
        const town = await getChannelById(database, 'town');
        expect(await firstValueFrom(observeIsThreadModerator(database, town, user))).toBe(false);

        await operator.handleMyChannel({
            channels: [TestHelper.fakeChannel({id: 'town', name: 'town', team_id: 'team1', type: General.OPEN_CHANNEL})],
            myChannels: [TestHelper.fakeChannelMember({id: 'town', channel_id: 'town', user_id: 'me', roles: 'channel_user channel_admin'})],
            prepareRecordsOnly: false,
        });
        expect(await firstValueFrom(observeIsThreadModerator(database, town, user))).toBe(true);
    });

    it('should know the community\'s admins for moderators', async () => {
        await operator.handleMyTeam({myTeams: [{id: 'team1', roles: 'team_user team_admin'}], prepareRecordsOnly: false});
        const town = await getChannelById(database, 'town');
        expect(await firstValueFrom(observeIsThreadModerator(database, town, user))).toBe(true);
    });

    it('should not take anyone for a moderator without a channel or a user', async () => {
        const town = await getChannelById(database, 'town');
        expect(await firstValueFrom(observeIsThreadModerator(database, undefined, user))).toBe(false);
        expect(await firstValueFrom(observeIsThreadModerator(database, town, undefined))).toBe(false);
    });
});
