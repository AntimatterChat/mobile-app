// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import DatabaseManager from '@database/manager';
import NetworkManager from '@managers/network_manager';
import {getPostById} from '@queries/servers/post';
import TestHelper from '@test/test_helper';

import {setThreadTitle} from './thread_title';

import type ServerDataOperator from '@database/operator/server_data_operator';

const serverUrl = 'threadtitle.test.com';
let operator: ServerDataOperator;

const mockClient = {
    patchPost: jest.fn(),
};

describe('setThreadTitle', () => {
    const root = TestHelper.fakePost({id: 'root-id', channel_id: 'channel-id', props: {from_bot: 'true'}});

    beforeAll(() => {
        // @ts-expect-error a client with only what's needed
        NetworkManager.getClient = () => mockClient;
    });

    beforeEach(async () => {
        await DatabaseManager.init([serverUrl]);
        operator = DatabaseManager.serverDatabases[serverUrl]!.operator;
        await operator.handlePosts({actionType: 'RECEIVED_NEW', order: [root.id], posts: [root], prepareRecordsOnly: false});
    });

    afterEach(async () => {
        await DatabaseManager.destroyServerDatabase(serverUrl);
        jest.clearAllMocks();
    });

    it('should patch the root\'s props, keeping the others, and keep the result', async () => {
        mockClient.patchPost.mockImplementation(async ({props}) => ({...root, props, update_at: 42}));

        const {error} = await setThreadTitle(serverUrl, 'root-id', '  Release 2.1 ');
        expect(error).toBeUndefined();
        expect(mockClient.patchPost).toHaveBeenCalledWith({id: 'root-id', props: {from_bot: 'true', am_thread_title: 'Release 2.1'}});

        const post = await getPostById(DatabaseManager.serverDatabases[serverUrl]!.database, 'root-id');
        expect(post?.props?.am_thread_title).toBe('Release 2.1');
        expect(post?.updateAt).toBe(42);
    });

    it('should report the server\'s refusal', async () => {
        mockClient.patchPost.mockRejectedValue(new Error('forbidden'));

        const {error} = await setThreadTitle(serverUrl, 'root-id', 'Name');
        expect(error).toBeTruthy();
    });
});
