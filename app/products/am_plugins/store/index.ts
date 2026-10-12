// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

import type {Poll, TodoLists} from '../types';

// In-memory state of the Antimatter plugins, per server: which plugins are enabled, the polls seen
// and the user's todo lists. None of it is kept in the database: polls and todos change live and
// are fetched again after a reconnection.

class ServerSubjects<T> {
    private subjects = new Map<string, BehaviorSubject<T>>();

    constructor(private initial: () => T) {}

    get(serverUrl: string) {
        let subject = this.subjects.get(serverUrl);
        if (!subject) {
            subject = new BehaviorSubject<T>(this.initial());
            this.subjects.set(serverUrl, subject);
        }
        return subject;
    }

    clear(serverUrl: string) {
        this.subjects.get(serverUrl)?.next(this.initial());
    }
}

class AmPluginsStore {
    private plugins = new ServerSubjects<Set<string>>(() => new Set());
    private polls = new ServerSubjects<Record<string, Poll>>(() => ({}));
    private todos = new ServerSubjects<TodoLists | undefined>(() => undefined);

    // Plugins

    setEnabledPlugins(serverUrl: string, ids: string[]) {
        this.plugins.get(serverUrl).next(new Set(ids));
    }

    isPluginEnabled(serverUrl: string, id: string) {
        return this.plugins.get(serverUrl).getValue().has(id);
    }

    observePluginEnabled(serverUrl: string, id: string) {
        return this.plugins.get(serverUrl).pipe(
            map((ids) => ids.has(id)),
            distinctUntilChanged(),
        );
    }

    // Polls

    getPoll(serverUrl: string, pollId: string): Poll | undefined {
        return this.polls.get(serverUrl).getValue()[pollId];
    }

    getPollIds(serverUrl: string) {
        return Object.keys(this.polls.get(serverUrl).getValue());
    }

    setPoll(serverUrl: string, poll: Poll) {
        const subject = this.polls.get(serverUrl);
        subject.next({...subject.getValue(), [poll.id]: poll});
    }

    setMyVotes(serverUrl: string, pollId: string, myVotes: number[]) {
        const poll = this.getPoll(serverUrl, pollId);
        if (poll) {
            this.setPoll(serverUrl, {...poll, my_votes: myVotes});
        }
    }

    observePoll(serverUrl: string, pollId: string) {
        return this.polls.get(serverUrl).pipe(
            map((polls) => polls[pollId]),
            distinctUntilChanged(),
        );
    }

    // The todo plugin's lists

    getTodoLists(serverUrl: string) {
        return this.todos.get(serverUrl).getValue();
    }

    setTodoLists(serverUrl: string, lists: TodoLists) {
        this.todos.get(serverUrl).next(lists);
    }

    observeTodoLists(serverUrl: string) {
        return this.todos.get(serverUrl).asObservable();
    }

    clear(serverUrl: string) {
        this.plugins.clear(serverUrl);
        this.polls.clear(serverUrl);
        this.todos.clear(serverUrl);
    }
}

export const amPluginsStore = new AmPluginsStore();
