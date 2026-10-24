// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fetchAssistantFeed} from '@assistant/actions/remote/feed';
import {assistantStore} from '@assistant/store';
import {act, renderHook} from '@testing-library/react-native';

import {useAssistantFeed} from './use_assistant_feed';

import type {AssistantCard} from '@assistant/types/assistant';

jest.mock('@assistant/actions/remote/feed');

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

describe('useAssistantFeed', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        assistantStore.clear(SERVER_URL);
        jest.mocked(fetchAssistantFeed).mockResolvedValue({data: undefined as any});
    });

    it('fetches the feed on mount', () => {
        renderHook(() => useAssistantFeed(SERVER_URL, CHANNEL_ID));
        expect(fetchAssistantFeed).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID);
    });

    it('does nothing without a channel', () => {
        renderHook(() => useAssistantFeed(SERVER_URL, undefined));
        expect(fetchAssistantFeed).not.toHaveBeenCalled();
    });

    it('picks up a card added over the websocket', () => {
        const {result} = renderHook(() => useAssistantFeed(SERVER_URL, CHANNEL_ID));

        act(() => {
            assistantStore.upsertCard(SERVER_URL, CHANNEL_ID, makeCard());
        });

        expect(result.current.cards).toHaveLength(1);
    });

    it('picks up an offer patch over the websocket', () => {
        const action = makeCard({
            id: 'action1',
            kind: 'action',
            offer: {id: 'offer1', status: 'open', holder_id: '', offered_to_me: false, can_run: false, moves_at: 0},
        });
        assistantStore.upsertCard(SERVER_URL, CHANNEL_ID, action);

        const {result} = renderHook(() => useAssistantFeed(SERVER_URL, CHANNEL_ID));

        act(() => {
            assistantStore.patchOffer(SERVER_URL, CHANNEL_ID, 'action1', {
                id: 'offer1',
                status: 'open',
                holder_id: 'me',
                offered_to_me: true,
                can_run: true,
                moves_at: 0,
            });
        });

        expect(result.current.cards[0].offer?.holder_id).toBe('me');
    });

    it('re-fetches on a channel switch', () => {
        const {rerender} = renderHook(({channelId}) => useAssistantFeed(SERVER_URL, channelId), {
            initialProps: {channelId: CHANNEL_ID},
        });
        jest.mocked(fetchAssistantFeed).mockClear();

        rerender({channelId: 'channel2'});

        expect(fetchAssistantFeed).toHaveBeenCalledWith(SERVER_URL, 'channel2');
    });
});
