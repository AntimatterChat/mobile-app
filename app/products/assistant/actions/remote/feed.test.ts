// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {assistantStore} from '@assistant/store';

import NetworkManager from '@managers/network_manager';

import {
    claimAssistantOffer,
    dismissAssistantCard,
    fetchAssistantFeed,
    fetchMutedAssistantTools,
    muteAssistantCard,
    pinAssistantCard,
    postAssistantCard,
    runAssistantOffer,
    setAssistantChannelEnabled,
    setAssistantPresence,
    setMutedAssistantTools,
    unmuteAssistantTool,
} from './feed';

import type {AssistantCard} from '@assistant/types/assistant';

jest.mock('@managers/network_manager');

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
        result: '23% average',
        status: 'new',
        pinned: false,
        create_at: 1000,
        update_at: 1000,
        ...overrides,
    };
}

const mockClient = {
    getAssistantFeed: jest.fn(),
    setAssistantPresence: jest.fn(),
    setAssistantChannelEnabled: jest.fn(),
    dismissAssistantCard: jest.fn(),
    pinAssistantCard: jest.fn(),
    muteAssistantCard: jest.fn(),
    claimAssistantOffer: jest.fn(),
    runAssistantOffer: jest.fn(),
    postAssistantCard: jest.fn(),
    getMutedAssistantTools: jest.fn(),
    setMutedAssistantTools: jest.fn(),
};

beforeAll(() => {
    jest.mocked(NetworkManager.getClient).mockReturnValue(mockClient as any);
});

beforeEach(() => {
    jest.clearAllMocks();
    assistantStore.clear(serverUrl);
});

describe('fetchAssistantFeed', () => {
    it('caches the feed in the store', async () => {
        mockClient.getAssistantFeed.mockResolvedValue({
            channel_id: channelId,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });

        const result = await fetchAssistantFeed(serverUrl, channelId);

        expect(result.error).toBeUndefined();
        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(1);
    });

    it('returns an error without touching the store on failure', async () => {
        mockClient.getAssistantFeed.mockRejectedValue(new Error('boom'));

        const result = await fetchAssistantFeed(serverUrl, channelId);

        expect(result.error).toBeDefined();
        expect(assistantStore.getFeed(serverUrl, channelId).loaded).toBe(false);
    });
});

describe('setAssistantPresence', () => {
    it('posts open:true', async () => {
        mockClient.setAssistantPresence.mockResolvedValue({following: true, ttl_seconds: 90, heartbeat_seconds: 30});
        const result = await setAssistantPresence(serverUrl, channelId, true);
        expect(mockClient.setAssistantPresence).toHaveBeenCalledWith(channelId, true);
        expect(result.data?.following).toBe(true);
    });
});

describe('setAssistantChannelEnabled', () => {
    it('updates the store\'s own switch', async () => {
        mockClient.setAssistantChannelEnabled.mockResolvedValue({on: false});
        await setAssistantChannelEnabled(serverUrl, channelId, false);
        expect(assistantStore.getFeed(serverUrl, channelId).on).toBe(false);
    });
});

describe('card actions', () => {
    it('dismissAssistantCard removes the card from the feed', async () => {
        assistantStore.setFeed(serverUrl, channelId, {
            channel_id: channelId,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });
        mockClient.dismissAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));

        await dismissAssistantCard(serverUrl, channelId, 'card1');

        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(0);
    });

    it('pinAssistantCard updates the card in place', async () => {
        assistantStore.setFeed(serverUrl, channelId, {
            channel_id: channelId,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });
        mockClient.pinAssistantCard.mockResolvedValue(makeCard({pinned: true}));

        await pinAssistantCard(serverUrl, channelId, 'card1', true);

        expect(assistantStore.getFeed(serverUrl, channelId).cards[0].pinned).toBe(true);
    });

    it('muteAssistantCard dismisses the card', async () => {
        assistantStore.setFeed(serverUrl, channelId, {
            channel_id: channelId,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });
        mockClient.muteAssistantCard.mockResolvedValue(makeCard({status: 'dismissed'}));

        await muteAssistantCard(serverUrl, channelId, 'card1');

        expect(assistantStore.getFeed(serverUrl, channelId).cards).toHaveLength(0);
    });

    it('claimAssistantOffer stores the claimed offer', async () => {
        const claimed = makeCard({
            kind: 'action',
            offer: {id: 'offer1', status: 'open', holder_id: 'me', offered_to_me: true, can_run: true, moves_at: 0},
        });
        mockClient.claimAssistantOffer.mockResolvedValue(claimed);

        const result = await claimAssistantOffer(serverUrl, channelId, 'card1');

        expect(result.data?.offer?.can_run).toBe(true);
    });

    it('runAssistantOffer stores the done offer and reports executed:false', async () => {
        const done = makeCard({
            kind: 'action',
            offer: {id: 'offer1', status: 'done', holder_id: 'me', offered_to_me: false, can_run: false, moves_at: 0, done_by: 'me', done_at: 123},
        });
        mockClient.runAssistantOffer.mockResolvedValue({card: done, executed: false});

        const result = await runAssistantOffer(serverUrl, channelId, 'card1');

        expect(result.data?.executed).toBe(false);
        expect(result.data?.card.offer?.status).toBe('done');
    });

    it('postAssistantCard marks the cached card posted', async () => {
        assistantStore.setFeed(serverUrl, channelId, {
            channel_id: channelId,
            enabled: true,
            on: true,
            engine: 'rules',
            cards: [makeCard()],
        });
        mockClient.postAssistantCard.mockResolvedValue({id: 'post1', message: '**Query Prometheus**\n23% average'});

        await postAssistantCard(serverUrl, channelId, 'card1');

        expect(assistantStore.getFeed(serverUrl, channelId).cards[0].status).toBe('posted');
    });
});

describe('muted tools', () => {
    it('fetchMutedAssistantTools caches the list', async () => {
        mockClient.getMutedAssistantTools.mockResolvedValue({tools: ['mcp.grafana.query_prometheus']});
        await fetchMutedAssistantTools(serverUrl);
        expect(assistantStore.getMutedTools(serverUrl)).toEqual(['mcp.grafana.query_prometheus']);
    });

    it('setMutedAssistantTools replaces the list', async () => {
        mockClient.setMutedAssistantTools.mockResolvedValue({tools: ['mcp.ci.deploy']});
        await setMutedAssistantTools(serverUrl, ['mcp.ci.deploy']);
        expect(assistantStore.getMutedTools(serverUrl)).toEqual(['mcp.ci.deploy']);
    });

    it('unmuteAssistantTool removes just that tool', async () => {
        assistantStore.setMutedTools(serverUrl, ['mcp.ci.deploy', 'mcp.grafana.query_prometheus']);
        mockClient.setMutedAssistantTools.mockResolvedValue({tools: ['mcp.grafana.query_prometheus']});

        await unmuteAssistantTool(serverUrl, 'mcp.ci.deploy');

        expect(mockClient.setMutedAssistantTools).toHaveBeenCalledWith(['mcp.grafana.query_prometheus']);
    });
});
