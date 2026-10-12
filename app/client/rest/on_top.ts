// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type ClientBase from './base';

// Antimatter: the messages put on top of a channel.
export interface ClientOnTopMix {
    getOnTopPosts: (channelId: string) => Promise<OnTopPost[]>;
    putPostOnTop: (postId: string, duration: number) => Promise<OnTopPost>;
    removePostFromTop: (postId: string) => Promise<unknown>;
}

const ClientOnTop = <TBase extends Constructor<ClientBase>>(superclass: TBase) => class extends superclass {
    getOnTopPosts = async (channelId: string) => {
        return this.doFetch(`${this.getChannelRoute(channelId)}/on_top`, {method: 'get'});
    };

    // putPostOnTop puts a message on top of its channel for a duration in milliseconds, or until
    // removed (0).
    putPostOnTop = async (postId: string, duration: number) => {
        return this.doFetch(`${this.getPostRoute(postId)}/on_top`, {method: 'put', body: {duration}});
    };

    removePostFromTop = async (postId: string) => {
        return this.doFetch(`${this.getPostRoute(postId)}/on_top`, {method: 'delete'});
    };
};

export default ClientOnTop;
