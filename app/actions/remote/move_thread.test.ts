// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';
import TestHelper from '@test/test_helper';

import {moveThread} from './move_thread';

const serverUrl = 'movethread.test.com';

const mockClient = {
    moveThreadToChannel: jest.fn(),
};

describe('moveThread', () => {
    beforeAll(() => {
        // @ts-expect-error a client with only what's needed
        NetworkManager.getClient = () => mockClient;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should move the thread and return the moved first message', async () => {
        const moved = TestHelper.fakePost({id: 'new-root', channel_id: 'target-id'});
        mockClient.moveThreadToChannel.mockResolvedValue(moved);

        const result = await moveThread(serverUrl, 'reply-id', 'target-id', true);
        expect(mockClient.moveThreadToChannel).toHaveBeenCalledWith('reply-id', 'target-id', true);
        expect(result).toEqual({post: moved});
    });

    it('should not flatten by default', async () => {
        mockClient.moveThreadToChannel.mockResolvedValue(TestHelper.fakePost({}));

        await moveThread(serverUrl, 'root-id', 'target-id');
        expect(mockClient.moveThreadToChannel).toHaveBeenCalledWith('root-id', 'target-id', false);
    });

    it('should return the server\'s error', async () => {
        const error = {status_code: 403, message: 'Only a moderator can move a thread with others\' replies from or to a private channel.'};
        mockClient.moveThreadToChannel.mockRejectedValue(error);

        const result = await moveThread(serverUrl, 'root-id', 'target-id');
        expect(result).toEqual({error});
    });
});
