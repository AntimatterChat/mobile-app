// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {deletePreference, savePreference} from '@actions/remote/preference';
import {updateMe} from '@actions/remote/user';
import {getCurrentUser} from '@queries/servers/user';
import TestHelper from '@test/test_helper';

import {DM_PRIVACY_CATEGORY, DMPrivacy, getProfilePrivacy, setCommunityDMPrivacy, setCommunityHiddenFields} from './community_privacy';

jest.mock('@actions/remote/preference');
jest.mock('@actions/remote/user');
jest.mock('@queries/servers/user');

const serverUrl = 'community-privacy.test.com';
const currentUserId = 'current-user-id';

describe('community privacy remote actions', () => {
    beforeEach(async () => {
        await TestHelper.setupServerDatabase(serverUrl);
        jest.clearAllMocks();
        jest.mocked(getCurrentUser).mockResolvedValue({id: currentUserId, props: {}} as any);
    });

    afterEach(async () => {
        await TestHelper.tearDown();
    });

    describe('getProfilePrivacy', () => {
        it("should read the current user's own profile_privacy prop", async () => {
            jest.mocked(getCurrentUser).mockResolvedValue({id: currentUserId, props: {profile_privacy: JSON.stringify({default: ['email']})}} as any);

            const result = await getProfilePrivacy(serverUrl);

            expect(result.privacy).toEqual({default: ['email']});
        });

        it('should error without a current user', async () => {
            jest.mocked(getCurrentUser).mockResolvedValue(undefined as any);

            const result = await getProfilePrivacy(serverUrl);

            expect(result.error).toBeDefined();
        });
    });

    describe('setCommunityHiddenFields', () => {
        it('should merge the new scope into the existing privacy prop and patch it', async () => {
            await setCommunityHiddenFields(serverUrl, 'team1', ['email', 'position']);

            expect(updateMe).toHaveBeenCalledWith(serverUrl, {
                props: expect.objectContaining({
                    profile_privacy: JSON.stringify({team1: ['email', 'position']}),
                }),
            });
        });

        it('should clear a scope when given null', async () => {
            jest.mocked(getCurrentUser).mockResolvedValue({id: currentUserId, props: {profile_privacy: JSON.stringify({default: ['email'], team1: ['position']})}} as any);

            await setCommunityHiddenFields(serverUrl, 'team1', null);

            expect(updateMe).toHaveBeenCalledWith(serverUrl, {
                props: expect.objectContaining({profile_privacy: JSON.stringify({default: ['email']})}),
            });
        });
    });

    describe('setCommunityDMPrivacy', () => {
        it('should save a preference with the chosen value', async () => {
            await setCommunityDMPrivacy(serverUrl, 'team1', DMPrivacy.REFUSE);

            expect(savePreference).toHaveBeenCalledWith(serverUrl, [
                {category: DM_PRIVACY_CATEGORY, name: 'team1', user_id: currentUserId, value: DMPrivacy.REFUSE},
            ]);
            expect(deletePreference).not.toHaveBeenCalled();
        });

        it('should delete the preference when given null (use my default)', async () => {
            await setCommunityDMPrivacy(serverUrl, 'team1', null);

            expect(deletePreference).toHaveBeenCalledWith(serverUrl, [
                {category: DM_PRIVACY_CATEGORY, name: 'team1', user_id: currentUserId, value: ''},
            ]);
            expect(savePreference).not.toHaveBeenCalled();
        });
    });
});
