// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import ActionCard from './action_card';

import type {AssistantCard} from '@assistant/types/assistant';

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'user1',
        channel_id: 'channel1',
        kind: 'action',
        tool: 'mcp.ci.deploy',
        tool_title: 'Deploy',
        arguments: {service: 'web-app'},
        why: {engine: 'model', probabilities: {card: 0.91}},
        post_ids: ['post1', 'post2'],
        dedupe_key: 'dedupe1',
        status: 'new',
        pinned: false,
        offer_id: 'offer1',
        offer: {id: 'offer1', status: 'open', holder_id: 'user2', offered_to_me: false, can_run: false, moves_at: 1792850520000},
        create_at: 1792850410000,
        update_at: 1792850410000,
        ...overrides,
    };
}

const noop = jest.fn();

describe('ActionCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the title and its arguments', () => {
        const card = makeCard();
        const {getByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={noop}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(getByTestId('action_card.title')).toHaveTextContent('Deploy');
        expect(getByTestId('action_card.argument.service')).toHaveTextContent('service: web-app');
    });

    it('shows Run only when can_run', () => {
        const card = makeCard({offer: {id: 'offer1', status: 'open', holder_id: 'me', offered_to_me: true, can_run: true, moves_at: 0}});
        const onRun = jest.fn();
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={onRun}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(queryByTestId('action_card.offered_to')).toBeNull();
        expect(queryByTestId('action_card.claim')).toBeNull();
        fireEvent.press(getByTestId('action_card.run'));
        expect(onRun).toHaveBeenCalledWith(card);
    });

    it('shows "Offered to <name>" when held by someone else', () => {
        const card = makeCard();
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                holderName='Priya'
                onRun={noop}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(getByTestId('action_card.offered_to')).toHaveTextContent('Offered to Priya');
        expect(queryByTestId('action_card.run')).toBeNull();
        expect(queryByTestId('action_card.claim')).toBeNull();
    });

    it('falls back to the holder id when no display name is available', () => {
        const card = makeCard();
        const {getByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={noop}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(getByTestId('action_card.offered_to')).toHaveTextContent('Offered to user2');
    });

    it('shows Claim when the offer is unheld', () => {
        const card = makeCard({offer: {id: 'offer1', status: 'open', holder_id: '', offered_to_me: false, can_run: false, moves_at: 0}});
        const onClaim = jest.fn();
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={noop}
                onClaim={onClaim}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(queryByTestId('action_card.offered_to')).toBeNull();
        fireEvent.press(getByTestId('action_card.claim'));
        expect(onClaim).toHaveBeenCalledWith(card);
    });

    it('shows the stub message once the offer is done', () => {
        const card = makeCard({
            offer: {id: 'offer1', status: 'done', holder_id: 'me', offered_to_me: false, can_run: false, moves_at: 0, done_by: 'me', done_at: 1},
        });
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={noop}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='action_card'
            />,
        );

        expect(getByTestId('action_card.ran')).toHaveTextContent('Recorded. Running actions comes in a later version.');
        expect(queryByTestId('action_card.run')).toBeNull();
        expect(queryByTestId('action_card.dismiss')).toBeNull();
    });

    it('calls onGoToMessage with the triggering post (the first of post_ids)', () => {
        const card = makeCard();
        const onGoToMessage = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <ActionCard
                card={card}
                onRun={noop}
                onClaim={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={onGoToMessage}
                testID='action_card'
            />,
        );

        fireEvent.press(getByTestId('action_card.go_to_message'));
        expect(onGoToMessage).toHaveBeenCalledWith('post1');
    });
});
