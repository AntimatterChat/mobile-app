// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {setCommunityProfile} from '@store/community_profile_store';
import TestHelper from '@test/test_helper';

import {observeCommunityAvatarSource, observeCommunityNickname} from './community_profile';

import type {Database} from '@nozbe/watermelondb';

describe('observeCommunityNickname', () => {
    let database: Database;
    const serverUrl = 'community-profile-query.test.com';

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it("should read the channel's own community member's nickname", async () => {
        const teamId = TestHelper.basicTeam!.id;
        const channelId = TestHelper.basicChannel!.id;
        setCommunityProfile(serverUrl, {team_id: teamId, user_id: 'user1', nickname: 'Nicky', update_at: 1});

        const nickname = await new Promise((resolve) => {
            const sub = observeCommunityNickname(database, serverUrl, channelId, 'user1').subscribe((value) => {
                resolve(value);
                sub.unsubscribe();
            });
        });

        expect(nickname).toBe('Nicky');
    });

    it('should be empty for a direct message (no team)', async () => {
        const dmChannel = TestHelper.fakeChannel({id: 'dm1', type: 'D', team_id: ''});
        const {operator} = (await import('@database/manager')).default.serverDatabases[serverUrl]!;
        await operator.handleChannel({channels: [dmChannel], prepareRecordsOnly: false});
        setCommunityProfile(serverUrl, {team_id: TestHelper.basicTeam!.id, user_id: 'user1', nickname: 'Nicky', update_at: 1});

        const nickname = await new Promise((resolve) => {
            const sub = observeCommunityNickname(database, serverUrl, dmChannel.id, 'user1').subscribe((value) => {
                resolve(value);
                sub.unsubscribe();
            });
        });

        expect(nickname).toBeUndefined();
    });
});

describe('observeCommunityAvatarSource', () => {
    let database: Database;
    const serverUrl = 'community-profile-query-avatar.test.com';
    const mockClient = {
        getCommunityAvatarUrl: jest.fn((teamId: string, userId: string, avatarUpdateAt: number) => `https://example.com/${teamId}/${userId}?_=${avatarUpdateAt}`),
    } as any;

    beforeAll(async () => {
        const server = await TestHelper.setupServerDatabase(serverUrl);
        database = server.database;
        NetworkManager.getClient = () => mockClient;
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('should build the community avatar URL when a picture is set', async () => {
        const teamId = TestHelper.basicTeam!.id;
        const channelId = TestHelper.basicChannel!.id;
        setCommunityProfile(serverUrl, {team_id: teamId, user_id: 'user1', avatar_update_at: 42, update_at: 42});

        const source = await new Promise((resolve) => {
            const sub = observeCommunityAvatarSource(database, serverUrl, channelId, 'user1').subscribe((value) => {
                resolve(value);
                sub.unsubscribe();
            });
        });

        expect(source).toEqual({uri: `https://example.com/${teamId}/user1?_=42`});
    });

    it('should be undefined when no community picture is set', async () => {
        const channelId = TestHelper.basicChannel!.id;

        const source = await new Promise((resolve) => {
            const sub = observeCommunityAvatarSource(database, serverUrl, channelId, 'user-with-no-profile').subscribe((value) => {
                resolve(value);
                sub.unsubscribe();
            });
        });

        expect(source).toBeUndefined();
    });
});
