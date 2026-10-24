// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {
    claimAssistantOffer,
    dismissAssistantCard,
    muteAssistantCard,
    pinAssistantCard,
    postAssistantCard,
    runAssistantOffer,
    setAssistantChannelEnabled,
} from '@assistant/actions/remote/feed';
import {useAssistantFeed} from '@assistant/hooks/use_assistant_feed';
import {useAssistantPresence} from '@assistant/hooks/use_assistant_presence';
import {useOfferHolderNames} from '@assistant/hooks/use_offer_holder_names';
import {act, fireEvent} from '@testing-library/react-native';
import React from 'react';

import {showPermalink} from '@actions/remote/permalink';
import {bottomSheet} from '@screens/navigation';
import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import AssistantScreen from './assistant';

import type {AssistantCard} from '@assistant/types/assistant';

const SERVER_URL = 'https://test.mattermost.com';
const CHANNEL_ID = 'channel1';

jest.mock('@context/server', () => ({
    useServerUrl: jest.fn(() => 'https://test.mattermost.com'),
}));
jest.mock('@screens/navigation', () => ({
    bottomSheet: jest.fn(),
}));
jest.mock('@actions/remote/permalink', () => ({
    showPermalink: jest.fn(),
}));
jest.mock('@assistant/actions/remote/feed');
jest.mock('@assistant/hooks/use_assistant_feed', () => ({
    useAssistantFeed: jest.fn(),
}));

// An explicit factory (no automock): automocking would require the real module to
// introspect its shape, which pulls in '@react-navigation/native' at module scope and
// that package's ESM build isn't one Jest's transform is configured to handle.
jest.mock('@assistant/hooks/use_assistant_presence', () => ({
    useAssistantPresence: jest.fn(),
}));
jest.mock('@assistant/hooks/use_offer_holder_names', () => ({
    useOfferHolderNames: jest.fn(),
}));

// InsightCard's MessageAttachments pulls in Markdown (mentions, config lookups, ...), which
// needs a real watermelondb database and a working '@context/server' (this file's own mock
// above only stubs useServerUrl): mocked out here, same reasoning as insight_card.test.tsx.
jest.mock('@components/post_list/post/body/content/message_attachments', () => {
    return function MockMessageAttachments() {
        return null;
    };
});

function makeInsight(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'insight1',
        user_id: 'user1',
        channel_id: CHANNEL_ID,
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {},
        why: {engine: 'rules', words: ['cpu on www-1']},
        post_ids: ['post1'],
        dedupe_key: 'd1',
        result: '23% average',
        status: 'new',
        pinned: false,
        create_at: 1,
        update_at: 1,
        ...overrides,
    };
}

describe('AssistantScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useAssistantPresence).mockReturnValue({following: true});
        jest.mocked(useOfferHolderNames).mockReturnValue({});
        jest.mocked(setAssistantChannelEnabled).mockResolvedValue({data: {on: false}});
        jest.mocked(dismissAssistantCard).mockResolvedValue({data: makeInsight({status: 'dismissed'})});
        jest.mocked(pinAssistantCard).mockResolvedValue({data: makeInsight({pinned: true})});
        jest.mocked(muteAssistantCard).mockResolvedValue({data: makeInsight({status: 'dismissed'})});
        jest.mocked(postAssistantCard).mockResolvedValue({data: {id: 'p1'} as any});
        jest.mocked(runAssistantOffer).mockResolvedValue({data: {card: makeInsight(), executed: false}});
        jest.mocked(claimAssistantOffer).mockResolvedValue({data: makeInsight()});
    });

    it('shows the "following" indicator when presence says so', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);
        expect(getByTestId('assistant.screen.following')).toBeTruthy();
    });

    it('shows the off state when the channel is disabled', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: false, on: true, engine: 'rules', cards: [], loaded: true});
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);
        expect(getByTestId('assistant.screen.off')).toBeTruthy();
        expect(queryByTestId('assistant.screen.list')).toBeNull();
    });

    it('does not show the off state before the feed has loaded', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: false, on: true, engine: 'rules', cards: [], loaded: false});
        const {queryByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);
        expect(queryByTestId('assistant.screen.off')).toBeNull();
    });

    it('renders an insight card from the feed', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [makeInsight()], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);
        expect(getByTestId('assistant.card.insight1')).toBeTruthy();
    });

    it('toggles the per-channel switch', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

        fireEvent.press(getByTestId('assistant.screen.toggle'));

        expect(setAssistantChannelEnabled).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, false);
    });

    it('opens the muted tools settings sheet', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

        fireEvent.press(getByTestId('assistant.screen.settings'));

        expect(bottomSheet).toHaveBeenCalled();
    });

    it('wires Post/Pin/Dismiss/Mute through to the remote actions', async () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [makeInsight()], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

        await act(async () => {
            fireEvent.press(getByTestId('assistant.card.insight1.post'));
            await Promise.resolve();
        });
        expect(postAssistantCard).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, 'insight1');

        await act(async () => {
            fireEvent.press(getByTestId('assistant.card.insight1.pin'));
            await Promise.resolve();
        });
        expect(pinAssistantCard).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, 'insight1', true);

        await act(async () => {
            fireEvent.press(getByTestId('assistant.card.insight1.dismiss'));
            await Promise.resolve();
        });
        expect(dismissAssistantCard).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, 'insight1');

        await act(async () => {
            fireEvent.press(getByTestId('assistant.card.insight1.mute'));
            await Promise.resolve();
        });
        expect(muteAssistantCard).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, 'insight1');

        fireEvent.press(getByTestId('assistant.card.insight1.go_to_message'));
        expect(showPermalink).toHaveBeenCalledWith(SERVER_URL, '', 'post1');
    });

    it('wires Run and Claim through to the remote actions for action cards', async () => {
        const action: AssistantCard = {
            ...makeInsight({id: 'action1', kind: 'action'}),
            offer: {id: 'offer1', status: 'open', holder_id: 'me', offered_to_me: true, can_run: true, moves_at: 0},
        };
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'model', cards: [action], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

        await act(async () => {
            fireEvent.press(getByTestId('assistant.card.action1.run'));
            await Promise.resolve();
        });
        expect(runAssistantOffer).toHaveBeenCalledWith(SERVER_URL, CHANNEL_ID, 'action1');
    });

    it('shows an empty message once loaded with no cards', () => {
        jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: [], loaded: true});
        const {getByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);
        expect(getByTestId('assistant.screen.empty')).toBeTruthy();
    });

    describe('chat order and the jump-to-bottom chip', () => {
        function scroll(getByTestId: (id: string) => any, distanceFromBottom: number) {
            act(() => {
                getByTestId('assistant.screen.list').props.onScroll({
                    nativeEvent: {
                        contentOffset: {y: 0},
                        contentSize: {height: 1000, width: 400},
                        layoutMeasurement: {height: 1000 - distanceFromBottom, width: 400},
                    },
                });
            });
        }

        it('renders oldest at the top and newest at the bottom', () => {
            const cards = [
                makeInsight({id: 'oldest', create_at: 1}),
                makeInsight({id: 'middle', create_at: 2}),
                makeInsight({id: 'newest', create_at: 3}),
            ];
            jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards, loaded: true});
            const {getAllByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

            const order = getAllByTestId(/^assistant\.card\.\w+$/).map((node: any) => node.props.testID);
            expect(order).toEqual(['assistant.card.oldest', 'assistant.card.middle', 'assistant.card.newest']);
        });

        it('stays pinned to the bottom for a new card when the reader is already there', () => {
            const cards = [makeInsight({id: 'one', create_at: 1}), makeInsight({id: 'two', create_at: 2})];
            jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards, loaded: true});
            const {rerender, queryByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

            expect(queryByTestId('assistant.screen.jump_to_bottom')).toBeNull();

            const withNewCard = [...cards, makeInsight({id: 'three', create_at: 3})];
            jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: withNewCard, loaded: true});
            act(() => {
                rerender(<AssistantScreen channelId={CHANNEL_ID}/>);
            });

            // Still at the bottom: no chip, the list just scrolls there itself.
            expect(queryByTestId('assistant.screen.jump_to_bottom')).toBeNull();
        });

        it('shows the chip for a new card when the reader has scrolled away, and jumping down dismisses it', () => {
            const cards = [makeInsight({id: 'one', create_at: 1}), makeInsight({id: 'two', create_at: 2})];
            jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards, loaded: true});
            const {rerender, getByTestId, queryByTestId} = renderWithIntlAndTheme(<AssistantScreen channelId={CHANNEL_ID}/>);

            // Scroll away from the bottom.
            scroll(getByTestId, 600);
            expect(queryByTestId('assistant.screen.jump_to_bottom')).toBeNull();

            const withNewCard = [...cards, makeInsight({id: 'three', create_at: 3})];
            jest.mocked(useAssistantFeed).mockReturnValue({enabled: true, on: true, engine: 'rules', cards: withNewCard, loaded: true});
            act(() => {
                rerender(<AssistantScreen channelId={CHANNEL_ID}/>);
            });

            const chip = getByTestId('assistant.screen.jump_to_bottom');
            expect(chip).toBeTruthy();

            fireEvent.press(chip);
            expect(queryByTestId('assistant.screen.jump_to_bottom')).toBeNull();
        });
    });
});
