// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {SYSTEM_IDENTIFIERS} from '@constants/database';
import {FOCUS_UNTIL_PROP} from '@constants/focus';
import DatabaseManager from '@database/manager';
import {getCurrentUser} from '@queries/servers/user';
import TestHelper from '@test/test_helper';

import {setLocalFocusUntil} from './focus';

import type ServerDataOperator from '@database/operator/server_data_operator';

const serverUrl = 'focus.local.test.com';
let operator: ServerDataOperator;

beforeEach(async () => {
    await DatabaseManager.init([serverUrl]);
    operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
});

afterEach(async () => {
    await DatabaseManager.destroyServerDatabase(serverUrl);
});

describe('setLocalFocusUntil', () => {
    it('returns an error when there is no current user', async () => {
        const result = await setLocalFocusUntil(serverUrl, Date.now());
        expect(result.error).toBeDefined();
    });

    it('sets the marker on the current user, keeping their other props', async () => {
        const user = TestHelper.fakeUser({id: 'userid', username: 'username', roles: '', props: {customStatus: '{}'}});
        await operator.handleUsers({users: [user], prepareRecordsOnly: false});
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: user.id}], prepareRecordsOnly: false});

        const until = Date.now() + 3600000;
        const {error} = await setLocalFocusUntil(serverUrl, until);
        expect(error).toBeUndefined();

        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const current = await getCurrentUser(database);
        expect(current?.props?.[FOCUS_UNTIL_PROP]).toBe(until);
        expect(current?.props?.customStatus).toBe('{}');
    });

    it('clears the marker, keeping the rest', async () => {
        const user = TestHelper.fakeUser({id: 'userid2', username: 'username2', roles: '', props: {[FOCUS_UNTIL_PROP]: Date.now() + 3600000, customStatus: '{}'}});
        await operator.handleUsers({users: [user], prepareRecordsOnly: false});
        await operator.handleSystem({systems: [{id: SYSTEM_IDENTIFIERS.CURRENT_USER_ID, value: user.id}], prepareRecordsOnly: false});

        const {error} = await setLocalFocusUntil(serverUrl, null);
        expect(error).toBeUndefined();

        const {database} = DatabaseManager.getServerDatabaseAndOperator(serverUrl);
        const current = await getCurrentUser(database);
        expect(current?.props?.[FOCUS_UNTIL_PROP]).toBeUndefined();
        expect(current?.props?.customStatus).toBe('{}');
    });
});
