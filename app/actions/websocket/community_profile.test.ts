// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchCommunityProfiles} from '@actions/remote/community_profile';

import {handleCommunityProfileUpdatedEvent} from './community_profile';

jest.mock('@actions/remote/community_profile');

describe('handleCommunityProfileUpdatedEvent', () => {
    it("should refetch the community's profiles using the broadcast's team id", async () => {
        const serverUrl = 'server1';
        await handleCommunityProfileUpdatedEvent(serverUrl, {data: {}, broadcast: {team_id: 'team1'}} as WebSocketMessage);

        expect(fetchCommunityProfiles).toHaveBeenCalledWith(serverUrl, 'team1');
    });

    it('should fall back to a team id on the data payload', async () => {
        const serverUrl = 'server1';
        await handleCommunityProfileUpdatedEvent(serverUrl, {data: {team_id: 'team1'}, broadcast: {}} as WebSocketMessage);

        expect(fetchCommunityProfiles).toHaveBeenCalledWith(serverUrl, 'team1');
    });

    it('should do nothing without a team id anywhere', async () => {
        await handleCommunityProfileUpdatedEvent('server1', {data: {}, broadcast: {}} as WebSocketMessage);

        expect(fetchCommunityProfiles).not.toHaveBeenCalled();
    });
});
