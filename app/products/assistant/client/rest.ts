// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {
    AssistantEnabledResponse,
    AssistantFeedResponse,
    AssistantMutedToolsResponse,
    AssistantPresenceResponse,
    AssistantRunResponse,
    AssistantCard,
} from '@assistant/types/assistant';

// The ambient assistant's own REST API (ASSISTANT_API.md), exactly as it describes it:
// native (not a plugin), under /api/v4/assistant. Every route is the caller's own.
export interface ClientAssistantMix {
    getAssistantRoute: () => string;
    getAssistantFeed: (channelId: string) => Promise<AssistantFeedResponse>;
    setAssistantPresence: (channelId: string, open: boolean) => Promise<AssistantPresenceResponse>;
    setAssistantChannelEnabled: (channelId: string, on: boolean) => Promise<AssistantEnabledResponse>;
    dismissAssistantCard: (channelId: string, cardId: string) => Promise<AssistantCard>;
    pinAssistantCard: (channelId: string, cardId: string, pinned: boolean) => Promise<AssistantCard>;
    muteAssistantCard: (channelId: string, cardId: string) => Promise<AssistantCard>;
    claimAssistantOffer: (channelId: string, cardId: string) => Promise<AssistantCard>;
    runAssistantOffer: (channelId: string, cardId: string) => Promise<AssistantRunResponse>;
    postAssistantCard: (channelId: string, cardId: string) => Promise<Post>;
    getMutedAssistantTools: () => Promise<AssistantMutedToolsResponse>;
    setMutedAssistantTools: (tools: string[]) => Promise<AssistantMutedToolsResponse>;
}

const ClientAssistant = (superclass: any) => class extends superclass {
    getAssistantRoute = () => {
        return `${this.urlVersion}/assistant`;
    };

    getAssistantChannelRoute = (channelId: string) => {
        return `${this.getAssistantRoute()}/channels/${channelId}`;
    };

    getAssistantCardRoute = (channelId: string, cardId: string) => {
        return `${this.getAssistantChannelRoute(channelId)}/cards/${cardId}`;
    };

    getAssistantFeed = async (channelId: string): Promise<AssistantFeedResponse> => {
        return this.doFetch(
            `${this.getAssistantChannelRoute(channelId)}/feed`,
            {method: 'get'},
        );
    };

    setAssistantPresence = async (channelId: string, open: boolean): Promise<AssistantPresenceResponse> => {
        return this.doFetch(
            `${this.getAssistantChannelRoute(channelId)}/presence`,
            {method: 'post', body: {open}},
        );
    };

    setAssistantChannelEnabled = async (channelId: string, on: boolean): Promise<AssistantEnabledResponse> => {
        return this.doFetch(
            `${this.getAssistantChannelRoute(channelId)}/enabled`,
            {method: 'put', body: {on}},
        );
    };

    dismissAssistantCard = async (channelId: string, cardId: string): Promise<AssistantCard> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/dismiss`,
            {method: 'post'},
        );
    };

    pinAssistantCard = async (channelId: string, cardId: string, pinned: boolean): Promise<AssistantCard> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/pin`,
            {method: 'post', body: {pinned}},
        );
    };

    muteAssistantCard = async (channelId: string, cardId: string): Promise<AssistantCard> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/mute`,
            {method: 'post'},
        );
    };

    claimAssistantOffer = async (channelId: string, cardId: string): Promise<AssistantCard> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/claim`,
            {method: 'post'},
        );
    };

    runAssistantOffer = async (channelId: string, cardId: string): Promise<AssistantRunResponse> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/run`,
            {method: 'post'},
        );
    };

    postAssistantCard = async (channelId: string, cardId: string): Promise<Post> => {
        return this.doFetch(
            `${this.getAssistantCardRoute(channelId, cardId)}/post`,
            {method: 'post'},
        );
    };

    getMutedAssistantTools = async (): Promise<AssistantMutedToolsResponse> => {
        return this.doFetch(
            `${this.getAssistantRoute()}/muted_tools`,
            {method: 'get'},
        );
    };

    setMutedAssistantTools = async (tools: string[]): Promise<AssistantMutedToolsResponse> => {
        return this.doFetch(
            `${this.getAssistantRoute()}/muted_tools`,
            {method: 'put', body: {tools}},
        );
    };
};

export default ClientAssistant;
