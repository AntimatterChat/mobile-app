// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Sparkline from '@assistant/components/sparkline';
import {ASSISTANT_MIN_SPARKLINE_POINTS} from '@assistant/constants';
import {sourceFromTool} from '@assistant/utils/source';
import React, {useMemo} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Text, View} from 'react-native';

import Button from '@components/button';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type {AssistantCard} from '@assistant/types/assistant';

const messages = defineMessages({
    matched: {id: 'assistant.insight.matched', defaultMessage: 'Matched: {words}'},
    probabilities: {id: 'assistant.insight.probabilities', defaultMessage: 'Likely: {items}'},
    goToMessage: {id: 'assistant.insight.go_to_message', defaultMessage: 'Go to message'},
    postToChannel: {id: 'assistant.insight.post_to_channel', defaultMessage: 'Post to channel'},
    posted: {id: 'assistant.insight.posted', defaultMessage: 'Posted to the channel'},
    pin: {id: 'assistant.insight.pin', defaultMessage: 'Pin'},
    unpin: {id: 'assistant.insight.unpin', defaultMessage: 'Unpin'},
    dismiss: {id: 'assistant.insight.dismiss', defaultMessage: 'Dismiss'},
    mute: {id: 'assistant.insight.mute', defaultMessage: 'Don\'t suggest this kind again'},
    postWarning: {id: 'assistant.insight.post_warning', defaultMessage: 'Some people in this channel may not have access to {source}.'},
});

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    card: {
        borderWidth: 1,
        borderColor: changeOpacity(theme.centerChannelColor, 0.16),
        borderRadius: 8,
        padding: 12,
        gap: 8,
        backgroundColor: theme.centerChannelBg,
    },
    title: {
        color: theme.centerChannelColor,
        ...typography('Heading', 200, 'SemiBold'),
    },
    summary: {
        color: theme.centerChannelColor,
        ...typography('Body', 200),
    },
    sparklineRow: {
        marginTop: 4,
    },
    why: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    goToMessage: {
        color: theme.linkColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    warning: {
        color: theme.errorTextColor,
        ...typography('Body', 75),
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
    postedLabel: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'SemiBold'),
    },
}));

type Props = {
    card: AssistantCard;
    onPost: (card: AssistantCard) => void;
    onPin: (card: AssistantCard) => void;
    onDismiss: (card: AssistantCard) => void;
    onMute: (card: AssistantCard) => void;
    onGoToMessage: (postId: string) => void;
    busy?: string | null;
    testID?: string;
};

const InsightCard = ({card, onPost, onPin, onDismiss, onMute, onGoToMessage, busy, testID}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    const source = useMemo(() => sourceFromTool(card.tool, card.tool_title), [card.tool, card.tool_title]);
    const triggerPostId = card.post_ids[0];

    const whyText = useMemo(() => {
        if (card.why.words && card.why.words.length > 0) {
            return intl.formatMessage(messages.matched, {words: card.why.words.join(', ')});
        }
        if (card.why.probabilities) {
            const items = Object.entries(card.why.probabilities).
                map(([key, value]) => `${key} ${Math.round(value * 100)}%`).
                join(' · ');
            return intl.formatMessage(messages.probabilities, {items});
        }
        return undefined;
    }, [card.why, intl]);

    const onPostPress = usePreventDoubleTap(React.useCallback(() => onPost(card), [onPost, card]));
    const onPinPress = usePreventDoubleTap(React.useCallback(() => onPin(card), [onPin, card]));
    const onDismissPress = usePreventDoubleTap(React.useCallback(() => onDismiss(card), [onDismiss, card]));
    const onMutePress = usePreventDoubleTap(React.useCallback(() => onMute(card), [onMute, card]));
    const onGoToMessagePress = usePreventDoubleTap(React.useCallback(() => {
        if (triggerPostId) {
            onGoToMessage(triggerPostId);
        }
    }, [onGoToMessage, triggerPostId]));

    const hasSparkline = (card.data_points?.length ?? 0) >= ASSISTANT_MIN_SPARKLINE_POINTS;
    const isPosted = card.status === 'posted';

    return (
        <View
            style={styles.card}
            testID={testID}
            accessibilityLabel={card.tool_title}
        >
            <Text
                style={styles.title}
                testID={`${testID}.title`}
            >
                {card.tool_title}
            </Text>
            {Boolean(card.result) && (
                <Text
                    style={styles.summary}
                    testID={`${testID}.summary`}
                >
                    {card.result}
                </Text>
            )}
            {hasSparkline && (
                <View style={styles.sparklineRow}>
                    <Sparkline
                        data={card.data_points!}
                        testID={`${testID}.sparkline`}
                    />
                </View>
            )}
            {Boolean(whyText) && (
                <Text
                    style={styles.why}
                    testID={`${testID}.why`}
                >
                    {whyText}
                </Text>
            )}
            {Boolean(triggerPostId) && (
                <Text
                    style={styles.goToMessage}
                    onPress={onGoToMessagePress}
                    accessibilityRole='link'
                    testID={`${testID}.go_to_message`}
                >
                    {intl.formatMessage(messages.goToMessage)}
                </Text>
            )}
            {!isPosted && (
                <Text
                    style={styles.warning}
                    testID={`${testID}.post_warning`}
                >
                    {intl.formatMessage(messages.postWarning, {source})}
                </Text>
            )}
            <View style={styles.row}>
                {isPosted ? (
                    <Text
                        style={styles.postedLabel}
                        testID={`${testID}.posted`}
                    >
                        {intl.formatMessage(messages.posted)}
                    </Text>
                ) : (
                    <Button
                        theme={theme}
                        size='s'
                        emphasis='primary'
                        iconName='send'
                        text={intl.formatMessage(messages.postToChannel)}
                        onPress={onPostPress}
                        showLoader={busy === 'post'}
                        testID={`${testID}.post`}
                    />
                )}
                <Button
                    theme={theme}
                    size='s'
                    emphasis='tertiary'
                    iconName='pin-outline'
                    text={intl.formatMessage(card.pinned ? messages.unpin : messages.pin)}
                    onPress={onPinPress}
                    showLoader={busy === 'pin'}
                    testID={`${testID}.pin`}
                />
                <Button
                    theme={theme}
                    size='s'
                    emphasis='tertiary'
                    iconName='close-circle-outline'
                    text={intl.formatMessage(messages.dismiss)}
                    onPress={onDismissPress}
                    showLoader={busy === 'dismiss'}
                    testID={`${testID}.dismiss`}
                />
                <Button
                    theme={theme}
                    size='s'
                    emphasis='tertiary'
                    iconName='bell-off-outline'
                    text={intl.formatMessage(messages.mute)}
                    onPress={onMutePress}
                    showLoader={busy === 'mute'}
                    testID={`${testID}.mute`}
                />
            </View>
        </View>
    );
};

export default InsightCard;
