// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {assistantStore} from '@assistant/store';

import type {AssistantCardAddedEvent, AssistantCardUpdatedEvent, AssistantOfferUpdatedEvent} from '@assistant/types/assistant';

// The assistant's three websocket events (ASSISTANT_API.md) go to one person's clients
// only, never a channel or community, so there is nothing to filter here beyond reading
// the payload: whatever arrives is already this person's own card or offer.

export function handleAssistantCardAdded(serverUrl: string, msg: WebSocketMessage<AssistantCardAddedEvent>) {
    const data = msg.data;
    if (!data?.card || !data.channel_id) {
        return;
    }
    assistantStore.upsertCard(serverUrl, data.channel_id, data.card);
}

export function handleAssistantCardUpdated(serverUrl: string, msg: WebSocketMessage<AssistantCardUpdatedEvent>) {
    const data = msg.data;
    if (!data?.card || !data.channel_id) {
        return;
    }
    assistantStore.upsertCard(serverUrl, data.channel_id, data.card);
}

export function handleAssistantOfferUpdated(serverUrl: string, msg: WebSocketMessage<AssistantOfferUpdatedEvent>) {
    const data = msg.data;
    if (!data?.card_id || !data.channel_id) {
        return;
    }
    assistantStore.patchOffer(serverUrl, data.channel_id, data.card_id, data.offer);
}

// handleAssistantReconnect clears the cached feeds: an open screen re-reads GET /feed on
// reconnect (same pattern as the Calendar app's own handleCalendarReconnect), so nothing
// here is stale after a missed event.
export async function handleAssistantReconnect(serverUrl: string) {
    assistantStore.clear(serverUrl);
}
