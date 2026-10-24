// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {assistantStore} from '@assistant/store';

import NetworkManager from '@managers/network_manager';
import {getFullErrorMessage} from '@utils/errors';
import {logDebug} from '@utils/log';

import type {AssistantCard, AssistantEnabledResponse, AssistantFeedResponse, AssistantPresenceResponse, AssistantRunResponse} from '@assistant/types/assistant';

// fetchAssistantFeed reads the person's feed for a channel (GET /feed) and caches it in the
// store, so the screen and anything else showing that channel's feed read the same value.
export async function fetchAssistantFeed(serverUrl: string, channelId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: AssistantFeedResponse = await client.getAssistantFeed(channelId);
        assistantStore.setFeed(serverUrl, channelId, response);
        return {data: response};
    } catch (error) {
        logDebug('error on fetchAssistantFeed', getFullErrorMessage(error));
        return {error};
    }
}

// setAssistantPresence tells the server the screen opened or closed on a channel (POST
// /presence). The caller is responsible for the 30s heartbeat while it stays open.
export async function setAssistantPresence(serverUrl: string, channelId: string, open: boolean) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: AssistantPresenceResponse = await client.setAssistantPresence(channelId, open);
        return {data: response};
    } catch (error) {
        logDebug('error on setAssistantPresence', getFullErrorMessage(error));
        return {error};
    }
}

// setAssistantChannelEnabled is the person's own on/off switch for a channel (PUT
// /enabled). Turning it off also closes the presence and forgets the feed server-side.
export async function setAssistantChannelEnabled(serverUrl: string, channelId: string, on: boolean) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: AssistantEnabledResponse = await client.setAssistantChannelEnabled(channelId, on);
        assistantStore.setChannelEnabled(serverUrl, channelId, response.on);
        return {data: response};
    } catch (error) {
        logDebug('error on setAssistantChannelEnabled', getFullErrorMessage(error));
        return {error};
    }
}

function applyCard(serverUrl: string, channelId: string, card: AssistantCard) {
    assistantStore.upsertCard(serverUrl, channelId, card);
    return card;
}

export async function dismissAssistantCard(serverUrl: string, channelId: string, cardId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const card: AssistantCard = await client.dismissAssistantCard(channelId, cardId);
        return {data: applyCard(serverUrl, channelId, card)};
    } catch (error) {
        logDebug('error on dismissAssistantCard', getFullErrorMessage(error));
        return {error};
    }
}

export async function pinAssistantCard(serverUrl: string, channelId: string, cardId: string, pinned: boolean) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const card: AssistantCard = await client.pinAssistantCard(channelId, cardId, pinned);
        return {data: applyCard(serverUrl, channelId, card)};
    } catch (error) {
        logDebug('error on pinAssistantCard', getFullErrorMessage(error));
        return {error};
    }
}

// muteAssistantCard is "Don't suggest this kind again": it mutes the card's tool for the
// person everywhere and dismisses this card.
export async function muteAssistantCard(serverUrl: string, channelId: string, cardId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const card: AssistantCard = await client.muteAssistantCard(channelId, cardId);
        return {data: applyCard(serverUrl, channelId, card)};
    } catch (error) {
        logDebug('error on muteAssistantCard', getFullErrorMessage(error));
        return {error};
    }
}

export async function claimAssistantOffer(serverUrl: string, channelId: string, cardId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const card: AssistantCard = await client.claimAssistantOffer(channelId, cardId);
        return {data: applyCard(serverUrl, channelId, card)};
    } catch (error) {
        logDebug('error on claimAssistantOffer', getFullErrorMessage(error));
        return {error};
    }
}

// runAssistantOffer claims and closes the offer for everyone and audits it server-side, but
// never actually runs the tool in stage 1 (`executed` is always false): the screen shows
// "Recorded. Running actions comes in a later version." on success.
export async function runAssistantOffer(serverUrl: string, channelId: string, cardId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response: AssistantRunResponse = await client.runAssistantOffer(channelId, cardId);
        applyCard(serverUrl, channelId, response.card);
        return {data: response};
    } catch (error) {
        logDebug('error on runAssistantOffer', getFullErrorMessage(error));
        return {error};
    }
}

// postAssistantCard posts an insight's content to its channel as the person. The caller
// shows the "some people in this channel may not have access" warning before calling this;
// the server itself only enforces the ordinary create_post permission.
export async function postAssistantCard(serverUrl: string, channelId: string, cardId: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const post: Post = await client.postAssistantCard(channelId, cardId);

        // The server answers with the new post, not the card; re-read the card itself so
        // the feed shows status "posted" without a second round trip through the feed.
        const card = assistantStore.getFeed(serverUrl, channelId).cards.find((c) => c.id === cardId);
        if (card) {
            applyCard(serverUrl, channelId, {...card, status: 'posted'});
        }
        return {data: post};
    } catch (error) {
        logDebug('error on postAssistantCard', getFullErrorMessage(error));
        return {error};
    }
}

export async function fetchMutedAssistantTools(serverUrl: string) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response = await client.getMutedAssistantTools();
        assistantStore.setMutedTools(serverUrl, response.tools);
        return {data: response.tools};
    } catch (error) {
        logDebug('error on fetchMutedAssistantTools', getFullErrorMessage(error));
        return {error};
    }
}

export async function setMutedAssistantTools(serverUrl: string, tools: string[]) {
    try {
        const client = NetworkManager.getClient(serverUrl);
        const response = await client.setMutedAssistantTools(tools);
        assistantStore.setMutedTools(serverUrl, response.tools);
        return {data: response.tools};
    } catch (error) {
        logDebug('error on setMutedAssistantTools', getFullErrorMessage(error));
        return {error};
    }
}

// unmuteAssistantTool removes a single tool from the muted list (the settings sheet's own
// "Unmute"): read-modify-write, since PUT replaces the whole list.
export async function unmuteAssistantTool(serverUrl: string, tool: string) {
    const current = assistantStore.getMutedTools(serverUrl);
    return setMutedAssistantTools(serverUrl, current.filter((t) => t !== tool));
}
