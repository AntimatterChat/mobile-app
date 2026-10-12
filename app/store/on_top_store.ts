// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {BehaviorSubject} from 'rxjs';

import {applyOnTopChange, type OnTopChange} from '@utils/on_top';

// Antimatter: the messages put on top of the channels opened, per server, in memory. A channel's
// list is loaded when it's opened; the websocket keeps it up to date, and the changes that come
// while it loads are applied over the response rather than lost.

type ChannelState = {
    subject: BehaviorSubject<OnTopPost[] | undefined>;
    pending?: OnTopChange[];
};

class OnTopStore {
    private channels = new Map<string, Map<string, ChannelState>>();

    private getState(serverUrl: string, channelId: string): ChannelState {
        let server = this.channels.get(serverUrl);
        if (!server) {
            server = new Map();
            this.channels.set(serverUrl, server);
        }
        let state = server.get(channelId);
        if (!state) {
            state = {subject: new BehaviorSubject<OnTopPost[] | undefined>(undefined)};
            server.set(channelId, state);
        }
        return state;
    }

    observe(serverUrl: string, channelId: string) {
        return this.getState(serverUrl, channelId).subject.asObservable();
    }

    get(serverUrl: string, channelId: string): OnTopPost[] | undefined {
        return this.getState(serverUrl, channelId).subject.getValue();
    }

    // startLoading starts collecting the changes received while the channel's list loads.
    startLoading(serverUrl: string, channelId: string) {
        const state = this.getState(serverUrl, channelId);
        state.pending = state.pending ?? [];
    }

    // loaded sets the channel's list, with the changes received while it loaded applied.
    loaded(serverUrl: string, channelId: string, list: OnTopPost[]) {
        const state = this.getState(serverUrl, channelId);
        const pending = state.pending ?? [];
        state.pending = undefined;
        state.subject.next(pending.reduce(applyOnTopChange, list));
    }

    loadFailed(serverUrl: string, channelId: string) {
        this.getState(serverUrl, channelId).pending = undefined;
    }

    // applyChange applies a change to a channel's list when it's loaded or loading; the others are
    // loaded when they're opened.
    applyChange(serverUrl: string, channelId: string, change: OnTopChange) {
        const state = this.getState(serverUrl, channelId);
        if (state.pending) {
            state.pending.push(change);
        }
        const list = state.subject.getValue();
        if (list) {
            state.subject.next(applyOnTopChange(list, change));
        }
    }

    // loadedChannels lists the channels whose lists are loaded, to load them again after a
    // reconnection.
    loadedChannels(serverUrl: string): string[] {
        const server = this.channels.get(serverUrl);
        if (!server) {
            return [];
        }
        return [...server.entries()].filter(([, state]) => state.subject.getValue() !== undefined).map(([id]) => id);
    }
}

export default new OnTopStore();
