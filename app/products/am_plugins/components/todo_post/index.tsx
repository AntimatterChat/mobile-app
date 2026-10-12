// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import Button from '@components/button';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {getFullErrorMessage} from '@utils/errors';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {answerTodo, fetchTodoListsOnce} from '../../actions/remote/todo';
import {amPluginsStore} from '../../store';

import type {TodoAction, TodoLists} from '../../types';
import type PostModel from '@typings/database/models/servers/post';

const messages = defineMessages({
    accept: {id: 'am_plugins.todo.accept', defaultMessage: 'Accept'},
    markDone: {id: 'am_plugins.todo.mark_done', defaultMessage: 'Mark as done'},
    decline: {id: 'am_plugins.todo.decline', defaultMessage: 'Decline'},
    answered: {id: 'am_plugins.todo.answered', defaultMessage: 'Answered'},
    error: {id: 'am_plugins.todo.error', defaultMessage: 'Something went wrong: {error}'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        gap: 8,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Body', 200),
    },
    todo: {
        borderLeftWidth: 3,
        borderLeftColor: theme.buttonBg,
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.04),
        borderRadius: 4,
        padding: 10,
        gap: 8,
    },
    todoText: {
        color: theme.centerChannelColor,
        ...typography('Body', 200, 'SemiBold'),
    },
    buttons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    muted: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    error: {
        color: theme.errorTextColor,
        ...typography('Body', 75),
    },
}));

type TodoProps = {
    message?: string;
    todo?: string;
    issueId?: string;
};

// isWaiting tells whether a todo someone sent the user still waits for their answer.
export function isWaiting(lists: TodoLists | undefined, issueId: string | undefined) {
    return Boolean(issueId && lists?.in?.some((item) => item.id === issueId));
}

// TodoPost is the todo bot's message about a todo someone sent the user (custom_todo posts): they
// accept it, mark it done or decline it from here while it waits for their answer, as in the todo
// plugin's web component.
const TodoPost = ({post}: {post: PostModel}) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const {message, todo, issueId} = (post.props || {}) as TodoProps;
    const [lists, setLists] = useState(() => amPluginsStore.getTodoLists(serverUrl));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const subscription = amPluginsStore.observeTodoLists(serverUrl).subscribe(setLists);
        if (issueId) {
            fetchTodoListsOnce(serverUrl);
        }
        return () => subscription.unsubscribe();
    }, [serverUrl, issueId]);

    const run = useCallback(async (action: TodoAction) => {
        if (!issueId) {
            return;
        }
        setBusy(true);
        setError('');
        const result = await answerTodo(serverUrl, action, issueId);
        if (result.error) {
            setError(intl.formatMessage(messages.error, {error: getFullErrorMessage(result.error)}));
        }
        setBusy(false);
    }, [serverUrl, issueId, intl]);

    const onAccept = useCallback(() => run('accept'), [run]);
    const onComplete = useCallback(() => run('complete'), [run]);
    const onDecline = useCallback(() => run('remove'), [run]);

    const waiting = isWaiting(lists, issueId);

    return (
        <View
            style={styles.container}
            testID={`todo_post.${post.id}`}
        >
            {Boolean(message) && <Text style={styles.title}>{message}</Text>}
            <View style={styles.todo}>
                {Boolean(todo) && <Text style={styles.todoText}>{todo}</Text>}
                {waiting && (
                    <View style={styles.buttons}>
                        <Button
                            theme={theme}
                            size='s'
                            emphasis='primary'
                            text={intl.formatMessage(messages.accept)}
                            onPress={onAccept}
                            disabled={busy}
                            testID='todo_post.accept'
                        />
                        <Button
                            theme={theme}
                            size='s'
                            emphasis='tertiary'
                            text={intl.formatMessage(messages.markDone)}
                            onPress={onComplete}
                            disabled={busy}
                            testID='todo_post.complete'
                        />
                        <Button
                            theme={theme}
                            size='s'
                            emphasis='tertiary'
                            isDestructive={true}
                            text={intl.formatMessage(messages.decline)}
                            onPress={onDecline}
                            disabled={busy}
                            testID='todo_post.decline'
                        />
                    </View>
                )}
                {!waiting && Boolean(lists && issueId) && (
                    <FormattedText
                        {...messages.answered}
                        style={styles.muted}
                    />
                )}
                {Boolean(error) && <Text style={styles.error}>{error}</Text>}
            </View>
        </View>
    );
};

export default TodoPost;
