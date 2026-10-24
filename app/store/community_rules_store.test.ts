// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCommunityRules, observeCommunityRulesStore, setCommunityRules} from './community_rules_store';

describe('community rules store', () => {
    it('should return nothing for a community it has not heard of', () => {
        expect(getCommunityRules('server-rules-1', 'team1')).toBeUndefined();
    });

    it('should keep the rules of each community, by server and team id', () => {
        const serverUrl = 'server-rules-2';
        const rules: CommunityRules = {
            team_id: 'team1',
            enabled: true,
            text: 'Be kind.',
            version: 2,
            updated_by: 'admin1',
            update_at: 123,
            accepted_version: 0,
            must_accept: true,
        };

        setCommunityRules(serverUrl, rules);

        expect(getCommunityRules(serverUrl, 'team1')).toEqual(rules);
        expect(getCommunityRules(serverUrl, 'team2')).toBeUndefined();
        expect(getCommunityRules('server-rules-other', 'team1')).toBeUndefined();
    });

    it('should notify observers of a later update', () => {
        const serverUrl = 'server-rules-3';
        const first: CommunityRules = {team_id: 'team1', enabled: true, text: 'v1', version: 1, updated_by: 'a', update_at: 1, accepted_version: 0, must_accept: true};
        const second: CommunityRules = {...first, text: 'v2', version: 2};

        setCommunityRules(serverUrl, first);

        const seen: Array<Record<string, CommunityRules>> = [];
        const subscription = observeCommunityRulesStore(serverUrl).subscribe((value) => seen.push(value));

        setCommunityRules(serverUrl, second);

        expect(seen).toEqual([{team1: first}, {team1: second}]);
        subscription.unsubscribe();
    });
});
