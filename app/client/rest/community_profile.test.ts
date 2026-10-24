// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import TestHelper from '@test/test_helper';

import type ClientBase from './base';
import type {ClientCommunityProfileMix} from './community_profile';

describe('ClientCommunityProfile', () => {
    let client: ClientCommunityProfileMix & ClientBase;

    beforeAll(() => {
        client = TestHelper.createClient();
        client.doFetch = jest.fn();
    });

    test('getCommunityProfiles', async () => {
        const teamId = 'team_id';
        const expectedUrl = `${client.getTeamRoute(teamId)}/profiles`;

        await client.getCommunityProfiles(teamId);

        expect(client.doFetch).toHaveBeenCalledWith(expectedUrl, {method: 'get'});
    });

    test('patchCommunityProfile', async () => {
        const teamId = 'team_id';
        const userId = 'user_id';
        const patch = {nickname: 'Nicky'};
        const expectedUrl = `${client.getTeamMemberRoute(teamId, userId)}/profile`;

        await client.patchCommunityProfile(teamId, userId, patch);

        expect(client.doFetch).toHaveBeenCalledWith(expectedUrl, {method: 'patch', body: patch});
    });

    test('resetCommunityProfile', async () => {
        const teamId = 'team_id';
        const userId = 'user_id';
        const reset = {avatar: true};
        const expectedUrl = `${client.getTeamMemberRoute(teamId, userId)}/profile/reset`;

        await client.resetCommunityProfile(teamId, userId, reset);

        expect(client.doFetch).toHaveBeenCalledWith(expectedUrl, {method: 'post', body: reset});
    });

    test('getCommunityAvatarUrl', () => {
        const teamId = 'team_id';
        const userId = 'user_id';
        const expected = `${client.apiClient.baseUrl}${client.getTeamMemberRoute(teamId, userId)}/profile/image?_=42`;

        expect(client.getCommunityAvatarUrl(teamId, userId, 42)).toBe(expected);
    });
});
