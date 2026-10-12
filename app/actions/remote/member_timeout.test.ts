// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SYSTEM_IDENTIFIERS} from '@constants/database';
import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import MemberTimeoutStore from '@store/member_timeout_store';

import {fetchMyTeamTimeout} from './member_timeout';

const serverUrl = 'membertimeout.test.com';

const mockClient = {
    getTeamTimeouts: jest.fn(),
};

describe('fetchMyTeamTimeout', () => {
    beforeAll(() => {
        // @ts-expect-error a client with only what's needed
        NetworkManager.getClient = () => mockClient;
    });

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        const operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: 'me'}], prepareRecordsOnly: false});
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
        MemberTimeoutStore.clear();
    });

    it('should keep until when the current user is timed out', async () => {
        const until = Date.now() + 60000;
        mockClient.getTeamTimeouts.mockResolvedValue([
            {team_id: 't1', user_id: 'someone', until: until + 1000},
            {team_id: 't1', user_id: 'me', until},
        ]);

        expect(await fetchMyTeamTimeout(serverUrl, 't1')).toEqual({until});
        expect(MemberTimeoutStore.getUntil(serverUrl, 't1')).toBe(until);
        expect(MemberTimeoutStore.getUntil(serverUrl, 't2')).toBe(0);
    });

    it('should forget a timeout once lifted', async () => {
        MemberTimeoutStore.setUntil(serverUrl, 't1', Date.now() + 60000);
        mockClient.getTeamTimeouts.mockResolvedValue([{team_id: 't1', user_id: 'someone', until: Date.now() + 60000}]);

        await fetchMyTeamTimeout(serverUrl, 't1');
        expect(MemberTimeoutStore.getUntil(serverUrl, 't1')).toBe(0);
    });

    it('should report errors, keeping what it knew', async () => {
        const until = Date.now() + 60000;
        MemberTimeoutStore.setUntil(serverUrl, 't1', until);
        mockClient.getTeamTimeouts.mockRejectedValue(new Error('offline'));

        const {error} = await fetchMyTeamTimeout(serverUrl, 't1');
        expect(error).toBeTruthy();
        expect(MemberTimeoutStore.getUntil(serverUrl, 't1')).toBe(until);
    });
});
