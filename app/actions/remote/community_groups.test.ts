// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getCommunityGroups} from '@store/community_groups_store';

import {fetchCommunityGroups} from './community_groups';

jest.mock('@managers/network_manager');
jest.mock('@utils/log');

const serverUrl = 'community.test.com';
const config = {EnableCustomGroups: 'true'} as ClientConfig;

function fakeGroup(id: string) {
    return {id, name: id, display_name: id, description: '', source: 'custom', delete_at: 0, team_id: 'team1', member_ids: ['u1']};
}

describe('fetchCommunityGroups', () => {
    it('should load every page of groups and the communities\' settings', async () => {
        const firstPage = Array.from({length: 200}, (_, i) => fakeGroup(`g${i}`));
        const client = {
            getCommunityGroups: jest.fn().
                mockResolvedValueOnce(firstPage).
                mockResolvedValueOnce([fakeGroup('last')]),
        };
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        const teams = [{id: 'team1', hide_role_colors: true, require_team_badges: false}] as unknown as Team[];
        const result = await fetchCommunityGroups(serverUrl, teams, config);

        expect(client.getCommunityGroups).toHaveBeenCalledTimes(2);
        expect(client.getCommunityGroups).toHaveBeenNthCalledWith(2, 1, 200, undefined);
        expect(result.groups).toHaveLength(201);
        const state = getCommunityGroups(serverUrl);
        expect(Object.keys(state.groups)).toHaveLength(201);
        expect(state.communities.team1).toEqual({hideRoleColors: true, requireTeamBadges: false});
    });

    it('should not ask for groups when custom groups are off', async () => {
        const client = {getCommunityGroups: jest.fn()};
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        const result = await fetchCommunityGroups(serverUrl, [], {EnableCustomGroups: 'false'} as ClientConfig);

        expect(client.getCommunityGroups).not.toHaveBeenCalled();
        expect(result).toEqual({groups: []});
    });

    it('should return the error', async () => {
        const error = new Error('nope');
        const client = {getCommunityGroups: jest.fn().mockRejectedValue(error)};
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as never);

        const result = await fetchCommunityGroups(serverUrl, undefined, config);

        expect(result).toEqual({error});
    });
});
