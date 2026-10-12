// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildQueryString} from '@utils/helpers';

import {GIFS_PLUGIN_ID, NOTES_PLUGIN_ID, POLLS_PLUGIN_ID, TODO_PLUGIN_ID, WHITEBOARD_PLUGIN_ID} from '../constants';

import type {GifItem, GifKind, GifPage, GifsConfig, PluginDoc, Poll, PollRequest, TodoAction, TodoLists} from '../types';

// The REST APIs of the Antimatter plugins (polls, notes, whiteboard, todo, GIFs).
export interface ClientAmPluginsMix {
    getPoll: (pollId: string) => Promise<Poll>;
    createPoll: (request: PollRequest) => Promise<Poll>;
    votePoll: (pollId: string, option: number) => Promise<Poll>;
    unvotePoll: (pollId: string, option: number) => Promise<Poll>;
    closePoll: (pollId: string) => Promise<Poll>;

    getPluginDoc: (pluginId: typeof NOTES_PLUGIN_ID | typeof WHITEBOARD_PLUGIN_ID, docId: string) => Promise<PluginDoc>;
    getWhiteboardThumbnailUrl: (docId: string, updateAt: number) => string;

    getTodoLists: () => Promise<TodoLists>;
    answerTodo: (action: TodoAction, todoId: string) => Promise<unknown>;

    getGifsConfig: () => Promise<GifsConfig>;
    getFeaturedGifs: (kind: GifKind, pos?: string) => Promise<GifPage>;
    searchGifs: (kind: GifKind, query: string, pos?: string) => Promise<GifPage>;
    postGif: (item: GifItem, channelId: string, rootId?: string, query?: string) => Promise<unknown>;
}

const GIFS_PAGE_SIZE = 30;

const ClientAmPlugins = (superclass: any) => class extends superclass {
    getPollsRoute = () => `${this.getPluginRoute(POLLS_PLUGIN_ID)}/api/v1/polls`;

    getPoll = async (pollId: string) => {
        return this.doFetch(`${this.getPollsRoute()}/${pollId}`, {method: 'get'});
    };

    createPoll = async (request: PollRequest) => {
        return this.doFetch(this.getPollsRoute(), {method: 'post', body: request});
    };

    votePoll = async (pollId: string, option: number) => {
        return this.doFetch(`${this.getPollsRoute()}/${pollId}/vote`, {method: 'post', body: {option}});
    };

    unvotePoll = async (pollId: string, option: number) => {
        return this.doFetch(`${this.getPollsRoute()}/${pollId}/unvote`, {method: 'post', body: {option}});
    };

    closePoll = async (pollId: string) => {
        return this.doFetch(`${this.getPollsRoute()}/${pollId}/close`, {method: 'post'});
    };

    getPluginDoc = async (pluginId: string, docId: string) => {
        return this.doFetch(`${this.getPluginRoute(pluginId)}/api/v1/docs/${docId}`, {method: 'get'});
    };

    getWhiteboardThumbnailUrl = (docId: string, updateAt: number) => {
        return `${this.getBaseRoute()}${this.getPluginRoute(WHITEBOARD_PLUGIN_ID)}/api/v1/docs/${docId}/thumbnail${buildQueryString({t: updateAt})}`;
    };

    getTodoLists = async () => {
        return this.doFetch(`${this.getPluginRoute(TODO_PLUGIN_ID)}/lists`, {method: 'get'});
    };

    answerTodo = async (action: TodoAction, todoId: string) => {
        return this.doFetch(`${this.getPluginRoute(TODO_PLUGIN_ID)}/${action}`, {method: 'post', body: {id: todoId}});
    };

    getGifsRoute = () => `${this.getPluginRoute(GIFS_PLUGIN_ID)}/api/v1`;

    getGifsConfig = async () => {
        return this.doFetch(`${this.getGifsRoute()}/config`, {method: 'get'});
    };

    getFeaturedGifs = async (kind: GifKind, pos?: string) => {
        return this.doFetch(`${this.getGifsRoute()}/featured${buildQueryString({kind, pos, limit: GIFS_PAGE_SIZE})}`, {method: 'get'});
    };

    searchGifs = async (kind: GifKind, query: string, pos?: string) => {
        return this.doFetch(`${this.getGifsRoute()}/search${buildQueryString({kind, q: query, pos, limit: GIFS_PAGE_SIZE})}`, {method: 'get'});
    };

    postGif = async (item: GifItem, channelId: string, rootId?: string, query?: string) => {
        return this.doFetch(`${this.getGifsRoute()}/post`, {
            method: 'post',
            body: {kind: item.kind, id: item.id, channel_id: channelId, root_id: rootId || '', query: query || ''},
        });
    };
};

export default ClientAmPlugins;
