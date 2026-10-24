// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getCommunityRules} from '@store/community_rules_store';

import {acceptCommunityRules, fetchCommunityRules} from './community_rules';

const mockClient = {
    getCommunityRules: jest.fn(),
    acceptCommunityRules: jest.fn(),
} as any;

describe('community rules remote actions', () => {
    beforeEach(() => {
        NetworkManager.getClient = () => mockClient;
        jest.clearAllMocks();
    });

    describe('fetchCommunityRules', () => {
        it('should fetch and cache the rules', async () => {
            const serverUrl = 'server-fetch-rules';
            const rules: CommunityRules = {team_id: 'team1', enabled: true, text: 'Be kind.', version: 1, updated_by: 'admin', update_at: 1, accepted_version: 0, must_accept: true};
            mockClient.getCommunityRules.mockResolvedValueOnce(rules);

            const result = await fetchCommunityRules(serverUrl, 'team1');

            expect(result.rules).toEqual(rules);
            expect(getCommunityRules(serverUrl, 'team1')).toEqual(rules);
        });

        it('should return the error without caching anything on failure', async () => {
            const serverUrl = 'server-fetch-rules-error';
            mockClient.getCommunityRules.mockRejectedValueOnce(new Error('network error'));

            const result = await fetchCommunityRules(serverUrl, 'team1');

            expect(result.error).toBeDefined();
            expect(getCommunityRules(serverUrl, 'team1')).toBeUndefined();
        });
    });

    describe('acceptCommunityRules', () => {
        it('should accept and cache the returned rules', async () => {
            const serverUrl = 'server-accept-rules';
            const rules: CommunityRules = {team_id: 'team1', enabled: true, text: 'Be kind.', version: 2, updated_by: 'admin', update_at: 1, accepted_version: 2, must_accept: false};
            mockClient.acceptCommunityRules.mockResolvedValueOnce(rules);

            const result = await acceptCommunityRules(serverUrl, 'team1', 2);

            expect(result.rules).toEqual(rules);
            expect(getCommunityRules(serverUrl, 'team1')).toEqual(rules);
        });

        it('should refetch the rules and flag the conflict on a 409 (stale version)', async () => {
            const serverUrl = 'server-accept-rules-conflict';
            const refreshed: CommunityRules = {team_id: 'team1', enabled: true, text: 'New text.', version: 3, updated_by: 'admin', update_at: 2, accepted_version: 0, must_accept: true};
            mockClient.acceptCommunityRules.mockRejectedValueOnce({status_code: 409});
            mockClient.getCommunityRules.mockResolvedValueOnce(refreshed);

            const result = await acceptCommunityRules(serverUrl, 'team1', 2);

            expect(result.changed).toBe(true);
            expect(result.error).toBeDefined();
            expect(getCommunityRules(serverUrl, 'team1')).toEqual(refreshed);
        });
    });
});
