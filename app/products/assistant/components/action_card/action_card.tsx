// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

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
    run: {id: 'assistant.action.run', defaultMessage: 'Run'},
    claim: {id: 'assistant.action.claim', defaultMessage: 'Claim'},
    offeredTo: {id: 'assistant.action.offered_to', defaultMessage: 'Offered to {name}'},
    dismiss: {id: 'assistant.action.dismiss', defaultMessage: 'Dismiss'},
    mute: {id: 'assistant.action.mute', defaultMessage: 'Don\'t suggest this kind again'},
    ran: {id: 'assistant.action.ran', defaultMessage: 'Recorded. Running actions comes in a later version.'},
    goToMessage: {id: 'assistant.action.go_to_message', defaultMessage: 'Go to message'},
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
    argument: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75),
    },
    goToMessage: {
        color: theme.linkColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    offeredLabel: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'SemiBold'),
    },
    ranLabel: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'SemiBold'),
    },
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
    },
}));

type Props = {
    card: AssistantCard;
    holderName?: string;
    onRun: (card: AssistantCard) => void;
    onClaim: (card: AssistantCard) => void;
    onDismiss: (card: AssistantCard) => void;
    onMute: (card: AssistantCard) => void;
    onGoToMessage: (postId: string) => void;
    busy?: string | null;
    testID?: string;
};

const ActionCard = ({card, holderName, onRun, onClaim, onDismiss, onMute, onGoToMessage, busy, testID}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    const triggerPostId = card.post_ids[0];
    const offer = card.offer;
    const isDone = offer?.status === 'done';
    const isUnheld = Boolean(offer) && !offer!.holder_id && !isDone;

    const argumentEntries = useMemo(() => Object.entries(card.arguments || {}), [card.arguments]);

    const onRunPress = usePreventDoubleTap(React.useCallback(() => onRun(card), [onRun, card]));
    const onClaimPress = usePreventDoubleTap(React.useCallback(() => onClaim(card), [onClaim, card]));
    const onDismissPress = usePreventDoubleTap(React.useCallback(() => onDismiss(card), [onDismiss, card]));
    const onMutePress = usePreventDoubleTap(React.useCallback(() => onMute(card), [onMute, card]));
    const onGoToMessagePress = usePreventDoubleTap(React.useCallback(() => {
        if (triggerPostId) {
            onGoToMessage(triggerPostId);
        }
    }, [onGoToMessage, triggerPostId]));

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
            {argumentEntries.map(([key, value]) => (
                <Text
                    key={key}
                    style={styles.argument}
                    testID={`${testID}.argument.${key}`}
                >
                    {`${key}: ${String(value)}`}
                </Text>
            ))}
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
            {isDone ? (
                <Text
                    style={styles.ranLabel}
                    testID={`${testID}.ran`}
                >
                    {intl.formatMessage(messages.ran)}
                </Text>
            ) : (
                <View style={styles.row}>
                    {offer?.can_run && (
                        <Button
                            theme={theme}
                            size='s'
                            emphasis='primary'
                            iconName='play-outline'
                            text={intl.formatMessage(messages.run)}
                            onPress={onRunPress}
                            showLoader={busy === 'run'}
                            testID={`${testID}.run`}
                        />
                    )}
                    {!offer?.can_run && !isUnheld && (
                        <Text
                            style={styles.offeredLabel}
                            testID={`${testID}.offered_to`}
                        >
                            {intl.formatMessage(messages.offeredTo, {name: holderName || offer?.holder_id})}
                        </Text>
                    )}
                    {isUnheld && (
                        <Button
                            theme={theme}
                            size='s'
                            emphasis='tertiary'
                            iconName='hand-right-outline'
                            text={intl.formatMessage(messages.claim)}
                            onPress={onClaimPress}
                            showLoader={busy === 'claim'}
                            testID={`${testID}.claim`}
                        />
                    )}
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
            )}
        </View>
    );
};

export default ActionCard;
