// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import {getCommunityProfile} from '@store/community_profile_store';
import TestHelper from '@test/test_helper';

import {fetchCommunityProfiles, patchCommunityProfile, resetCommunityProfile, uploadCommunityAvatar} from './community_profile';

const serverUrl = 'community-profile.test.com';

const mockClient = {
    getCommunityProfiles: jest.fn(),
    patchCommunityProfile: jest.fn(),
    resetCommunityProfile: jest.fn(),
    getCommunityProfileRoute: jest.fn((teamId: string, userId: string) => `/api/v4/teams/${teamId}/members/${userId}/profile`),
    getRequestHeaders: jest.fn(() => ({})),
    apiClient: {
        upload: jest.fn(),
    },
} as any;

describe('community profile remote actions', () => {
    let currentUserId: string;

    beforeEach(async () => {
        NetworkManager.getClient = () => mockClient;
        await TestHelper.setupServerDatabase(serverUrl);
        currentUserId = TestHelper.basicUser!.id;
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await TestHelper.tearDown();
    });

    describe('fetchCommunityProfiles', () => {
        it('should fetch and cache a whole team of profiles', async () => {
            const profiles: CommunityProfile[] = [{team_id: 'team1', user_id: 'user1', nickname: 'Al', update_at: 1}];
            mockClient.getCommunityProfiles.mockResolvedValueOnce(profiles);

            const result = await fetchCommunityProfiles(serverUrl, 'team1');

            expect(result.profiles).toEqual(profiles);
            expect(getCommunityProfile(serverUrl, 'team1', 'user1')).toEqual(profiles[0]);
        });

        it('should return the error on failure', async () => {
            mockClient.getCommunityProfiles.mockRejectedValueOnce(new Error('network error'));

            const result = await fetchCommunityProfiles(serverUrl, 'team1');

            expect(result.error).toBeDefined();
        });
    });

    describe('patchCommunityProfile', () => {
        it("should set and cache the current user's nickname", async () => {
            const profile: CommunityProfile = {team_id: 'team1', user_id: currentUserId, nickname: 'Nicky', update_at: 2};
            mockClient.patchCommunityProfile.mockResolvedValueOnce(profile);

            const result = await patchCommunityProfile(serverUrl, 'team1', 'Nicky');

            expect(mockClient.patchCommunityProfile).toHaveBeenCalledWith('team1', currentUserId, {nickname: 'Nicky'});
            expect(result.profile).toEqual(profile);
            expect(getCommunityProfile(serverUrl, 'team1', currentUserId)).toEqual(profile);
        });
    });

    describe('resetCommunityProfile', () => {
        it('should reset and cache the returned profile', async () => {
            const profile: CommunityProfile = {team_id: 'team1', user_id: currentUserId, update_at: 3};
            mockClient.resetCommunityProfile.mockResolvedValueOnce(profile);

            const result = await resetCommunityProfile(serverUrl, 'team1', {nickname: true, avatar: true});

            expect(mockClient.resetCommunityProfile).toHaveBeenCalledWith('team1', currentUserId, {nickname: true, avatar: true});
            expect(result.profile).toEqual(profile);
        });
    });

    describe('uploadCommunityAvatar', () => {
        it("should upload to the member's own community profile image route", async () => {
            const profile: CommunityProfile = {team_id: 'team1', user_id: currentUserId, avatar_update_at: 10, update_at: 10};
            mockClient.apiClient.upload.mockResolvedValueOnce({data: profile});

            const result = await uploadCommunityAvatar(serverUrl, 'team1', '/tmp/avatar.png');

            expect(mockClient.apiClient.upload).toHaveBeenCalledWith(
                `/api/v4/teams/team1/members/${currentUserId}/profile/image`,
                '/tmp/avatar.png',
                expect.objectContaining({method: 'POST', multipart: {fileKey: 'image'}}),
            );
            expect(result.profile).toEqual(profile);
            expect(getCommunityProfile(serverUrl, 'team1', currentUserId)).toEqual(profile);
        });
    });
});
