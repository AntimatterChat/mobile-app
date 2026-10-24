// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getCommunityProfile, observeCommunityProfilesStore, setCommunityProfile, setCommunityProfiles} from './community_profile_store';

describe('community profile store', () => {
    it('should return nothing for a member it has not heard of', () => {
        expect(getCommunityProfile('server-profile-1', 'team1', 'user1')).toBeUndefined();
    });

    it('should keep a whole team of profiles from a batch fetch', () => {
        const serverUrl = 'server-profile-2';
        const alice: CommunityProfile = {team_id: 'team1', user_id: 'alice', nickname: 'Al', update_at: 1};
        const bob: CommunityProfile = {team_id: 'team1', user_id: 'bob', update_at: 2};

        setCommunityProfiles(serverUrl, 'team1', [alice, bob]);

        expect(getCommunityProfile(serverUrl, 'team1', 'alice')).toEqual(alice);
        expect(getCommunityProfile(serverUrl, 'team1', 'bob')).toEqual(bob);
        expect(getCommunityProfile(serverUrl, 'team2', 'alice')).toBeUndefined();
    });

    it('should replace one member of a community without losing the others of the same team', () => {
        const serverUrl = 'server-profile-3';
        const alice: CommunityProfile = {team_id: 'team1', user_id: 'alice', nickname: 'Al', update_at: 1};
        const bob: CommunityProfile = {team_id: 'team1', user_id: 'bob', update_at: 2};
        setCommunityProfiles(serverUrl, 'team1', [alice, bob]);

        const updatedAlice: CommunityProfile = {...alice, nickname: 'Alicia', update_at: 3};
        setCommunityProfile(serverUrl, updatedAlice);

        expect(getCommunityProfile(serverUrl, 'team1', 'alice')).toEqual(updatedAlice);
        expect(getCommunityProfile(serverUrl, 'team1', 'bob')).toEqual(bob);
    });

    it('should notify observers of a later update', () => {
        const serverUrl = 'server-profile-4';
        const alice: CommunityProfile = {team_id: 'team1', user_id: 'alice', update_at: 1};
        setCommunityProfiles(serverUrl, 'team1', [alice]);

        const seen: unknown[] = [];
        const subscription = observeCommunityProfilesStore(serverUrl).subscribe((value) => seen.push(value));

        const updatedAlice: CommunityProfile = {...alice, nickname: 'Alicia', update_at: 2};
        setCommunityProfile(serverUrl, updatedAlice);

        expect(seen).toEqual([{team1: {alice}}, {team1: {alice: updatedAlice}}]);
        subscription.unsubscribe();
    });
});
