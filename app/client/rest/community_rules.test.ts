// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import TestHelper from '@test/test_helper';

import type ClientBase from './base';
import type {ClientCommunityRulesMix} from './community_rules';

describe('ClientCommunityRules', () => {
    let client: ClientCommunityRulesMix & ClientBase;

    beforeAll(() => {
        client = TestHelper.createClient();
        client.doFetch = jest.fn();
    });

    test('getCommunityRules', async () => {
        const teamId = 'team_id';
        const expectedUrl = `${client.getTeamRoute(teamId)}/rules`;

        await client.getCommunityRules(teamId);

        expect(client.doFetch).toHaveBeenCalledWith(expectedUrl, {method: 'get'});
    });

    test('acceptCommunityRules', async () => {
        const teamId = 'team_id';
        const version = 3;
        const expectedUrl = `${client.getTeamRoute(teamId)}/rules/accept`;

        await client.acceptCommunityRules(teamId, version);

        expect(client.doFetch).toHaveBeenCalledWith(expectedUrl, {method: 'post', body: {version}});
    });
});
