// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {assistantStore} from '@assistant/store';

import {handleAssistantCardAdded, handleAssistantCardUpdated, handleAssistantOfferUpdated, handleAssistantReconnect} from './index';

import type {AssistantCard} from '@assistant/types/assistant';

const serverUrl = 'https://test.mattermost.com';
const channelId = 'channel1';

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'user1',
        channel_id: channelId,
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {},
        why: {engine: 'rules'},
        post_ids: ['post1'],
        dedupe_key: 'dedupe1',
        result: '23%',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

beforeEach(() => {
    assistantStore.clear(serverUrl);
});

describe('handleAssistantCardAdded', () => {
    it('adds the card to the feed', () => {
        const msg = {event: 'assistant_card_added', data: {channel_id: channelId, card: makeCard()}} as any;
        handleAssistantCardAdded(serverUrl, msg);
        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(1);
    });

    it('ignores a message without data', () => {
        handleAssistantCardAdded(serverUrl, {event: 'assistant_card_added'} as any);
        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(0);
    });
});

describe('handleAssistantCardUpdated', () => {
    it('replaces the card (e.g. pinned, dismissed)', () => {
        assistantStore.upsertCard(serverUrl, channelId, makeCard());
        const msg = {event: 'assistant_card_updated', data: {channel_id: channelId, card: makeCard({pinned: true})}} as any;

        handleAssistantCardUpdated(serverUrl, msg);

        expect(assistantStore.getFeed(serverUrl, channelId).cards[0].pinned).toBe(true);
    });

    it('removes the card when dismissed', () => {
        assistantStore.upsertCard(serverUrl, channelId, makeCard());
        const msg = {event: 'assistant_card_updated', data: {channel_id: channelId, card: makeCard({status: 'dismissed'})}} as any;

        handleAssistantCardUpdated(serverUrl, msg);

        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(0);
    });
});

describe('handleAssistantOfferUpdated', () => {
    it('patches the named card\'s offer', () => {
        const action = makeCard({
            id: 'action1',
            kind: 'action',
            offer: {id: 'offer1', status: 'open', holder_id: 'other', offered_to_me: false, can_run: false, moves_at: 1},
        });
        assistantStore.upsertCard(serverUrl, channelId, action);

        const msg = {
            event: 'assistant_offer_updated',
            data: {
                channel_id: channelId,
                card_id: 'action1',
                offer: {id: 'offer1', status: 'open', holder_id: 'me', offered_to_me: true, can_run: true, moves_at: 0},
            },
        } as any;

        handleAssistantOfferUpdated(serverUrl, msg);

        const card = assistantStore.getFeed(serverUrl, channelId).cards[0];
        expect(card.offer?.holder_id).toBe('me');
        expect(card.offer?.can_run).toBe(true);
    });
});

describe('handleAssistantReconnect', () => {
    it('clears the cached feed', async () => {
        assistantStore.upsertCard(serverUrl, channelId, makeCard());
        await handleAssistantReconnect(serverUrl);
        expect(assistantStore.getFeed(serverUrl, channelId).loaded).toBe(false);
    });
});
