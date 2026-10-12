// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {forceLogoutIfNecessary} from '@actions/remote/session';
import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import {amPluginsStore} from '../../store';

import type {TodoAction} from '../../types';

const loading = new Map<string, Promise<unknown>>();

// fetchTodoLists loads the user's personal todo lists, to tell which received todos still wait for
// an answer.
export async function fetchTodoLists(serverUrl: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const lists = await client.getTodoLists();
        amPluginsStore.setTodoLists(serverUrl, lists || {});
        return {lists};
    } catch (error) {
        logDebug('error on fetchTodoLists', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        return {error};
    }
}

// fetchTodoListsOnce loads the lists unless they're loaded, or loading.
export async function fetchTodoListsOnce(serverUrl: string) {
    if (amPluginsStore.getTodoLists(serverUrl)) {
        return;
    }
    let request = loading.get(serverUrl);
    if (!request) {
        request = fetchTodoLists(serverUrl).finally(() => loading.delete(serverUrl));
        loading.set(serverUrl, request);
    }
    await request;
}

// refreshTodoListsIfLoaded loads the lists again when they were loaded, e.g. after the plugin said
// they changed.
export async function refreshTodoListsIfLoaded(serverUrl: string) {
    if (amPluginsStore.getTodoLists(serverUrl)) {
        await fetchTodoLists(serverUrl);
    }
}

// answerTodo accepts, completes or declines a todo someone sent the user.
export async function answerTodo(serverUrl: string, action: TodoAction, todoId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        await client.answerTodo(action, todoId);
        await fetchTodoLists(serverUrl);
        return {data: true};
    } catch (error) {
        logDebug('error on answerTodo', getFullErrorMessage(error));
        forceLogoutIfNecessary(serverUrl, error);
        await fetchTodoLists(serverUrl);
        return {error};
    }
}
