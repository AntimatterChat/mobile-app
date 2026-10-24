// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {assistantStore} from './index';

import type {AssistantCard, AssistantFeedResponse} from '@assistant/types/assistant';

const SERVER_URL = 'https://test.mattermost.com';
const CHANNEL_ID = 'channel1';

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'user1',
        channel_id: CHANNEL_ID,
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {},
        why: {engine: 'rules', pattern: 'ops.resource_usage', words: ['cpu on www-1'], entities: []},
        post_ids: ['post1'],
        dedupe_key: 'dedupe1',
        result: 'www-1 CPU, last hour: 23% average',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

describe('assistantStore', () => {
    afterEach(() => {
        assistantStore.clear(SERVER_URL);
    });

    it('returns a benign default before the feed has loaded', () => {
        const feed = assistantStore.getFeed(SERVER_URL, CHANNEL_ID);
        expect(feed.loaded).toBe(false);
        expect(feed.cards).toEqual([]);
    });

    it('setFeed stores the response, pinned first then newest', () => {
        const response: AssistantFeedResponse = {
            channel_id: CHANNEL_ID,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [
                makeCard({id: 'older', create_at: 1000}),
                makeCard({id: 'pinned', pinned: true, create_at: 500}),
                makeCard({id: 'newer', create_at: 2000}),
            ],
        };
        assistantStore.setFeed(SERVER_URL, CHANNEL_ID, response);

        const feed = assistantStore.getFeed(SERVER_URL, CHANNEL_ID);
        expect(feed.loaded).toBe(true);
        expect(feed.enabled).toBe(true);
        expect(feed.cards.map((c) => c.id)).toEqual(['pinned', 'newer', 'older']);
    });

    it('upsertCard adds a new card and removes a dismissed one', () => {
        assistantStore.setFeed(SERVER_URL, CHANNEL_ID, {
            channel_id: CHANNEL_ID,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard({id: 'card1'})],
        });

        assistantStore.upsertCard(SERVER_URL, CHANNEL_ID, makeCard({id: 'card2', create_at: 2000}));
        expect(assistantStore.getFeed(SERVER_URL, CHANNEL_ID).cards.map((c) => c.id)).toEqual(['card2', 'card1']);

        assistantStore.upsertCard(SERVER_URL, CHANNEL_ID, makeCard({id: 'card1', status: 'dismissed'}));
        expect(assistantStore.getFeed(SERVER_URL, CHANNEL_ID).cards.map((c) => c.id)).toEqual(['card2']);
    });

    it('patchOffer updates only the named card\'s offer', () => {
        const action = makeCard({
            id: 'action1',
            kind: 'action',
            offer_id: 'offer1',
            offer: {id: 'offer1', status: 'open', holder_id: 'user2', offered_to_me: false, can_run: false, moves_at: 123},
        });
        assistantStore.setFeed(SERVER_URL, CHANNEL_ID, {
            channel_id: CHANNEL_ID,
            enabled: true,
            on: true,
            engine: 'model',
            cards: [action],
        });

        assistantStore.patchOffer(SERVER_URL, CHANNEL_ID, 'action1', {
            id: 'offer1',
            status: 'open',
            holder_id: 'user1',
            offered_to_me: true,
            can_run: true,
            moves_at: 0,
        });

        const card = assistantStore.getFeed(SERVER_URL, CHANNEL_ID).cards[0];
        expect(card.offer?.holder_id).toBe('user1');
        expect(card.offer?.can_run).toBe(true);
    });

    it('setChannelEnabled flips the person\'s own switch without touching the cards', () => {
        assistantStore.setFeed(SERVER_URL, CHANNEL_ID, {
            channel_id: CHANNEL_ID,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });

        assistantStore.setChannelEnabled(SERVER_URL, CHANNEL_ID, false);

        const feed = assistantStore.getFeed(SERVER_URL, CHANNEL_ID);
        expect(feed.on).toBe(false);
        expect(feed.cards).toHaveLength(1);
    });

    it('tracks muted tools per server', () => {
        expect(assistantStore.getMutedTools(SERVER_URL)).toEqual([]);
        assistantStore.setMutedTools(SERVER_URL, ['mcp.grafana.query_prometheus']);
        expect(assistantStore.getMutedTools(SERVER_URL)).toEqual(['mcp.grafana.query_prometheus']);
    });

    it('observeFeed emits on updates', () => {
        const seen: boolean[] = [];
        const sub = assistantStore.observeFeed(SERVER_URL, CHANNEL_ID).subscribe((feed) => {
            seen.push(feed.loaded);
        });

        assistantStore.setFeed(SERVER_URL, CHANNEL_ID, {
            channel_id: CHANNEL_ID,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [],
        });

        sub.unsubscribe();
        expect(seen).toEqual([false, true]);
    });
});
