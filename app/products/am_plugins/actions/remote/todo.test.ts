// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import NetworkManager from '@managers/network_manager';

import {amPluginsStore} from '../../store';

import {answerTodo, fetchTodoListsOnce, refreshTodoListsIfLoaded} from './todo';

jest.mock('@managers/network_manager');
jest.mock('@actions/remote/session');
jest.mock('@utils/log');

const serverUrl = 'https://server.example.com';

describe('todo actions', () => {
    const client = {
        getTodoLists: jest.fn(),
        answerTodo: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        amPluginsStore.clear(serverUrl);
        jest.mocked(NetworkManager.getClient).mockReturnValue(client as any);
    });

    it('should load the lists once', async () => {
        client.getTodoLists.mockResolvedValue({in: [{id: 'todo1', message: 'Do it'}]});
        await Promise.all([fetchTodoListsOnce(serverUrl), fetchTodoListsOnce(serverUrl)]);
        await fetchTodoListsOnce(serverUrl);

        expect(client.getTodoLists).toHaveBeenCalledTimes(1);
        expect(amPluginsStore.getTodoLists(serverUrl)?.in).toHaveLength(1);
    });

    it('should not load the lists on refresh unless they were loaded', async () => {
        await refreshTodoListsIfLoaded(serverUrl);
        expect(client.getTodoLists).not.toHaveBeenCalled();
    });

    it('should answer a todo and load the lists again', async () => {
        client.answerTodo.mockResolvedValue({});
        client.getTodoLists.mockResolvedValue({in: []});
        const result = await answerTodo(serverUrl, 'accept', 'todo1');

        expect(client.answerTodo).toHaveBeenCalledWith('accept', 'todo1');
        expect(result.data).toBe(true);
        expect(amPluginsStore.getTodoLists(serverUrl)).toEqual({in: []});
    });

    it('should return the error of an answer that fails', async () => {
        client.answerTodo.mockRejectedValue(new Error('not found'));
        client.getTodoLists.mockResolvedValue({in: []});
        const result = await answerTodo(serverUrl, 'complete', 'todo1');

        expect(result.error).toBeDefined();
    });
});
