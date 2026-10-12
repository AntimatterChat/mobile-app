// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {POLLS_PLUGIN_ID} from '../constants';

import type {Poll, PollRequest} from '../types';

// The REST APIs of the Antimatter plugins.
export interface ClientAmPluginsMix {
    getPoll: (pollId: string) => Promise<Poll>;
    createPoll: (request: PollRequest) => Promise<Poll>;
    votePoll: (pollId: string, option: number) => Promise<Poll>;
    unvotePoll: (pollId: string, option: number) => Promise<Poll>;
    closePoll: (pollId: string) => Promise<Poll>;
}

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
};

export default ClientAmPlugins;
