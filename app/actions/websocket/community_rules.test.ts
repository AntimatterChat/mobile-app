// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchCommunityRules} from '@actions/remote/community_rules';
import {getCommunityRules, setCommunityRules} from '@store/community_rules_store';

import {handleCommunityRulesAcceptedEvent, handleCommunityRulesUpdatedEvent} from './community_rules';

jest.mock('@actions/remote/community_rules');

describe('handleCommunityRulesUpdatedEvent', () => {
    it('should refetch the rules of the community named in the event', async () => {
        const serverUrl = 'server1';
        await handleCommunityRulesUpdatedEvent(serverUrl, {data: {team_id: 'team1', enabled: true, version: 2}} as WebSocketMessage);

        expect(fetchCommunityRules).toHaveBeenCalledWith(serverUrl, 'team1');
    });

    it('should do nothing without a team id', async () => {
        await handleCommunityRulesUpdatedEvent('server1', {data: {}} as WebSocketMessage);

        expect(fetchCommunityRules).not.toHaveBeenCalled();
    });
});

describe('handleCommunityRulesAcceptedEvent', () => {
    it('should update the cached accepted version and clear must_accept', () => {
        const serverUrl = 'server-rules-accepted';
        setCommunityRules(serverUrl, {team_id: 'team1', enabled: true, text: 'x', version: 2, updated_by: 'a', update_at: 1, accepted_version: 0, must_accept: true});

        handleCommunityRulesAcceptedEvent(serverUrl, {data: {team_id: 'team1', version: 2}} as WebSocketMessage);

        expect(getCommunityRules(serverUrl, 'team1')).toEqual(expect.objectContaining({accepted_version: 2, must_accept: false}));
    });

    it('should do nothing for a community it has no cached rules for', () => {
        const serverUrl = 'server-rules-accepted-unknown';

        handleCommunityRulesAcceptedEvent(serverUrl, {data: {team_id: 'team1', version: 2}} as WebSocketMessage);

        expect(getCommunityRules(serverUrl, 'team1')).toBeUndefined();
    });
});
