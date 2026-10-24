// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {deletePreference, savePreference} from '@actions/remote/preference';
import {SYSTEM_IDENTIFIERS} from '@constants/database';
import DatabaseManager from '@database/manager';
import {COMMUNITY_NOTIFY_CATEGORY} from '@utils/community_notify';

import {getCommunityNotifyProps, resetCommunityNotifyProps, setCommunityNotifyProp} from './community_notifications';

import type ServerDataOperator from '@database/operator/server_data_operator';

jest.mock('@actions/remote/preference');

const serverUrl = 'community-notifications.test.com';
const currentUserId = 'current-user-id';

describe('community notifications remote actions', () => {
    let operator: ServerDataOperator;

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
        await operator.handleUsers({users: [{id: currentUserId, username: 'user1', roles: ''} as UserProfile], prepareRecordsOnly: false});
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: currentUserId}], prepareRecordsOnly: false});
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
    });

    describe('getCommunityNotifyProps', () => {
        it('should read nothing for a community with no override yet', async () => {
            const result = await getCommunityNotifyProps(serverUrl, 'team1');
            expect(result.props).toEqual({});
        });

        it('should read the stored overrides', async () => {
            await operator.handlePreferences({
                preferences: [{category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: JSON.stringify({desktop: 'mention'})}],
                prepareRecordsOnly: false,
            });

            const result = await getCommunityNotifyProps(serverUrl, 'team1');

            expect(result.props).toEqual({desktop: 'mention'});
        });
    });

    describe('setCommunityNotifyProp', () => {
        it('should save the merged overrides when something is still overridden', async () => {
            await operator.handlePreferences({
                preferences: [{category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: JSON.stringify({desktop: 'mention'})}],
                prepareRecordsOnly: false,
            });

            await setCommunityNotifyProp(serverUrl, 'team1', 'push', 'all');

            expect(savePreference).toHaveBeenCalledWith(serverUrl, [
                {category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: JSON.stringify({desktop: 'mention', push: 'all'})},
            ]);
            expect(deletePreference).not.toHaveBeenCalled();
        });

        it('should delete the preference once clearing a key leaves nothing overridden', async () => {
            await operator.handlePreferences({
                preferences: [{category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: JSON.stringify({desktop: 'mention'})}],
                prepareRecordsOnly: false,
            });

            await setCommunityNotifyProp(serverUrl, 'team1', 'desktop', '');

            expect(deletePreference).toHaveBeenCalledWith(serverUrl, [
                {category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: JSON.stringify({})},
            ]);
            expect(savePreference).not.toHaveBeenCalled();
        });
    });

    describe('resetCommunityNotifyProps', () => {
        it('should delete the whole preference', async () => {
            await resetCommunityNotifyProps(serverUrl, 'team1');

            expect(deletePreference).toHaveBeenCalledWith(serverUrl, [
                {category: COMMUNITY_NOTIFY_CATEGORY, name: 'team1', user_id: currentUserId, value: ''},
            ]);
        });
    });
});
