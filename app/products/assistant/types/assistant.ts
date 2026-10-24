// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Types for the ambient assistant's stage 1 API (ASSISTANT_API.md), exactly as the server
// describes them: a per-channel feed of insight and action cards, presence, the per-channel
// switch, muted tools, and the three websocket events that keep a feed current.

export type AssistantEngine = 'rules' | 'model';

export type AssistantCardKind = 'insight' | 'action';

export type AssistantCardStatus = 'new' | 'posted' | 'dismissed';

export type AssistantEntity = {
    type: string;
    value: string;
    text: string;
};

// The rules engine names the pattern, the words that matched and the entities; the model
// engine gives probabilities (card, tool, and one per argument by its name).
export type AssistantWhy = {
    engine: AssistantEngine;
    pattern?: string;
    words?: string[];
    entities?: AssistantEntity[];
    probabilities?: Record<string, number>;
};

export type AssistantOfferStatus = 'open' | 'done' | 'expired';

export type AssistantOffer = {
    id: string;
    status: AssistantOfferStatus;
    holder_id: string;
    offered_to_me: boolean;
    can_run: boolean;
    moves_at: number;
    done_by?: string;
    done_at?: number;
};

export type AssistantCard = {
    id: string;
    user_id: string;
    channel_id: string;
    kind: AssistantCardKind;
    tool: string;
    tool_title: string;
    arguments: Record<string, unknown>;
    why: AssistantWhy;
    post_ids: string[];
    dedupe_key: string;
    result?: string;

    status: AssistantCardStatus;
    pinned: boolean;
    offer_id?: string;
    offer?: AssistantOffer;
    create_at: number;
    update_at: number;
};

export type AssistantFeedResponse = {
    channel_id: string;
    enabled: boolean;
    on: boolean;
    engine: AssistantEngine;
    cards: AssistantCard[];
};

export type AssistantPresenceResponse = {
    following: boolean;
    ttl_seconds: number;
    heartbeat_seconds: number;
};

export type AssistantEnabledResponse = {
    on: boolean;
};

export type AssistantRunResponse = {
    card: AssistantCard;
    executed: boolean;
};

export type AssistantMutedToolsResponse = {
    tools: string[];
};

export type AssistantCardAddedEvent = {
    channel_id: string;
    card: AssistantCard;
};

export type AssistantCardUpdatedEvent = {
    channel_id: string;
    card: AssistantCard;
};

export type AssistantOfferUpdatedEvent = {
    channel_id: string;
    card_id: string;
    offer: AssistantOffer;
};
