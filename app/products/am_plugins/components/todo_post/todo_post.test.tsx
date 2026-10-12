// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {act, fireEvent, waitFor} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';
import TestHelper from '@test/test_helper';

import {answerTodo, fetchTodoListsOnce} from '../../actions/remote/todo';
import {amPluginsStore} from '../../store';

import TodoPost from './index';

jest.mock('../../actions/remote/todo');

const SERVER_URL = 'https://appv1.mattermost.com';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => SERVER_URL),
}));

describe('TodoPost', () => {
    const post = TestHelper.fakePostModel({
        id: 'post1',
        type: 'custom_todo',
        props: {message: 'You have received a new Todo from @maya', todo: 'Pull the numbers', issueId: 'todo1'},
    });

    beforeEach(() => {
        jest.clearAllMocks();
        amPluginsStore.clear(SERVER_URL);
        jest.mocked(answerTodo).mockResolvedValue({data: true});
    });

    it('should load the lists and show the todo', async () => {
        const {getByText, queryByTestId} = renderWithIntlAndTheme(<TodoPost post={post}/>);

        expect(getByText('You have received a new Todo from @maya')).toBeTruthy();
        expect(getByText('Pull the numbers')).toBeTruthy();
        expect(queryByTestId('todo_post.accept')).toBeNull();
        await waitFor(() => expect(fetchTodoListsOnce).toHaveBeenCalledWith(SERVER_URL));
    });

    it('should answer a todo waiting for the user', async () => {
        amPluginsStore.setTodoLists(SERVER_URL, {in: [{id: 'todo1', message: 'Pull the numbers'}]});
        const {getByTestId} = renderWithIntlAndTheme(<TodoPost post={post}/>);

        await act(async () => {
            fireEvent.press(getByTestId('todo_post.accept'));
        });
        expect(answerTodo).toHaveBeenCalledWith(SERVER_URL, 'accept', 'todo1');

        await act(async () => {
            fireEvent.press(getByTestId('todo_post.complete'));
        });
        expect(answerTodo).toHaveBeenCalledWith(SERVER_URL, 'complete', 'todo1');

        await act(async () => {
            fireEvent.press(getByTestId('todo_post.decline'));
        });
        expect(answerTodo).toHaveBeenCalledWith(SERVER_URL, 'remove', 'todo1');
    });

    it('should say a todo was answered once it no longer waits', async () => {
        amPluginsStore.setTodoLists(SERVER_URL, {in: [{id: 'todo1', message: 'Pull the numbers'}]});
        const {getByText, queryByTestId} = renderWithIntlAndTheme(<TodoPost post={post}/>);

        act(() => {
            amPluginsStore.setTodoLists(SERVER_URL, {in: []});
        });
        expect(queryByTestId('todo_post.accept')).toBeNull();
        expect(getByText('Answered')).toBeTruthy();
    });

    it('should show why an answer failed', async () => {
        amPluginsStore.setTodoLists(SERVER_URL, {in: [{id: 'todo1', message: 'Pull the numbers'}]});
        jest.mocked(answerTodo).mockResolvedValue({error: new Error('not found')});
        const {getByTestId, findByText} = renderWithIntlAndTheme(<TodoPost post={post}/>);

        await act(async () => {
            fireEvent.press(getByTestId('todo_post.accept'));
        });
        expect(await findByText('Something went wrong: not found')).toBeTruthy();
    });
});
