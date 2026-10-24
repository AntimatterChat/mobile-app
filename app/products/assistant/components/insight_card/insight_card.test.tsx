// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';
import React from 'react';

import {renderWithIntlAndTheme} from '@test/intl-test-helper';

import InsightCard from './insight_card';

import type {AssistantCard} from '@assistant/types/assistant';

function makeCard(overrides: Partial<AssistantCard> = {}): AssistantCard {
    return {
        id: 'card1',
        user_id: 'user1',
        channel_id: 'channel1',
        kind: 'insight',
        tool: 'mcp.grafana.query_prometheus',
        tool_title: 'Query Prometheus',
        arguments: {host: 'www-1', metric: 'cpu'},
        why: {engine: 'rules', pattern: 'ops.resource_usage', words: ['cpu on www-1'], entities: []},
        post_ids: ['post1'],
        dedupe_key: 'dedupe1',
        result: 'www-1 CPU, last hour: 23% average, 61% peak at 14:05',
        status: 'new',
        pinned: false,
        create_at: 1792850400000,
        update_at: 1792850400000,
        ...overrides,
    };
}

describe('InsightCard', () => {
    const noop = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the title, summary and why it matched', () => {
        const card = makeCard();
        const {getByTestId, getByText} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );

        expect(getByTestId('insight_card.title')).toHaveTextContent('Query Prometheus');
        expect(getByTestId('insight_card.summary')).toHaveTextContent('www-1 CPU, last hour: 23% average, 61% peak at 14:05');
        expect(getByText('Matched: cpu on www-1')).toBeTruthy();
    });

    it('shows probabilities when the model engine produced the card', () => {
        const card = makeCard({why: {engine: 'model', probabilities: {card: 0.91, tool: 0.88}}});
        const {getByText} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );

        expect(getByText('Likely: card 91% · tool 88%')).toBeTruthy();
    });

    it('draws a sparkline when the result has a points line', () => {
        const card = makeCard({result: 'www-1 CPU, last hour: 23% average\n  points: 1:1, 2:5, 3:3, 4:8, 5:2'});
        const {getByTestId} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );
        expect(getByTestId('insight_card.sparkline')).toBeTruthy();
    });

    it('does not draw a sparkline when the result has no points line', () => {
        const card = makeCard({result: 'www-1 CPU, last hour: 23% average'});
        const {queryByTestId} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );
        expect(queryByTestId('insight_card.sparkline')).toBeNull();
    });

    it('shows the "Post to channel" warning naming the source', () => {
        const card = makeCard();
        const {getByText} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );
        expect(getByText('Some people in this channel may not have access to Grafana.')).toBeTruthy();
    });

    it('calls onGoToMessage with the triggering post', () => {
        const card = makeCard();
        const onGoToMessage = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={onGoToMessage}
                testID='insight_card'
            />,
        );

        fireEvent.press(getByTestId('insight_card.go_to_message'));

        expect(onGoToMessage).toHaveBeenCalledWith('post1');
    });

    it('calls onPost, onPin, onDismiss and onMute with the card', () => {
        const card = makeCard();
        const onPost = jest.fn();
        const onPin = jest.fn();
        const onDismiss = jest.fn();
        const onMute = jest.fn();
        const {getByTestId} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={onPost}
                onPin={onPin}
                onDismiss={onDismiss}
                onMute={onMute}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );

        fireEvent.press(getByTestId('insight_card.post'));
        fireEvent.press(getByTestId('insight_card.pin'));
        fireEvent.press(getByTestId('insight_card.dismiss'));
        fireEvent.press(getByTestId('insight_card.mute'));

        expect(onPost).toHaveBeenCalledWith(card);
        expect(onPin).toHaveBeenCalledWith(card);
        expect(onDismiss).toHaveBeenCalledWith(card);
        expect(onMute).toHaveBeenCalledWith(card);
    });

    it('shows "Posted to the channel" instead of the Post button once posted', () => {
        const card = makeCard({status: 'posted'});
        const {getByTestId, queryByTestId} = renderWithIntlAndTheme(
            <InsightCard
                card={card}
                onPost={noop}
                onPin={noop}
                onDismiss={noop}
                onMute={noop}
                onGoToMessage={noop}
                testID='insight_card'
            />,
        );
        expect(getByTestId('insight_card.posted')).toBeTruthy();
        expect(queryByTestId('insight_card.post')).toBeNull();
    });
});
