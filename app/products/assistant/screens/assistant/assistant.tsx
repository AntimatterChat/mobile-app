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
import ActionCard from '@assistant/components/action_card';
import InsightCard from '@assistant/components/insight_card';
import MutedToolsSheet from '@assistant/components/muted_tools_sheet';
import {useAssistantFeed} from '@assistant/hooks/use_assistant_feed';
import {useAssistantPresence} from '@assistant/hooks/use_assistant_presence';
import {useOfferHolderNames} from '@assistant/hooks/use_offer_holder_names';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {FlatList, Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {showPermalink} from '@actions/remote/permalink';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {bottomSheet} from '@screens/navigation';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import type {AssistantCard} from '@assistant/types/assistant';

const messages = defineMessages({
    following: {id: 'assistant.screen.following', defaultMessage: 'Following this conversation'},
    off: {id: 'assistant.screen.off', defaultMessage: 'The assistant is off for this channel.'},
    empty: {id: 'assistant.screen.empty', defaultMessage: 'Nothing yet. Cards appear here as the conversation gives the assistant something to show.'},
    turnOn: {id: 'assistant.screen.turn_on', defaultMessage: 'Turn the assistant on for this channel'},
    turnOff: {id: 'assistant.screen.turn_off', defaultMessage: 'Turn the assistant off for this channel'},
    settings: {id: 'assistant.screen.settings', defaultMessage: 'Assistant settings'},
    newCard: {id: 'assistant.screen.new_card', defaultMessage: 'New card ↓'},
});

// How close to the bottom (in density-independent pixels) counts as "there": a reader need
// not be pinned to the exact last pixel to be considered caught up.
const BOTTOM_THRESHOLD = 32;

export type AssistantScreenProps = {
    channelId: string;
};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    flex: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: changeOpacity(theme.centerChannelColor, 0.08),
    },
    following: {
        flex: 1,
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    iconButton: {
        padding: 6,
    },
    icon: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        fontSize: 22,
    },
    iconOn: {
        color: theme.linkColor,
    },
    content: {
        padding: 12,
        gap: 12,
    },
    listWrapper: {
        flex: 1,
    },
    jumpChip: {
        position: 'absolute',
        alignSelf: 'center',
        bottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: theme.buttonBg,
        shadowColor: theme.centerChannelColor,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.16,
        shadowRadius: 4,
        elevation: 3,
    },
    jumpChipIcon: {
        color: theme.buttonColor,
        fontSize: 16,
    },
    jumpChipText: {
        color: theme.buttonColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    message: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 200),
        textAlign: 'center',
    },
}));

function busyKey(cardId: string, action: string) {
    return `${cardId}.${action}`;
}

const AssistantScreen = ({channelId}: AssistantScreenProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);

    const [busy, setBusy] = useState<string | null>(null);

    const {enabled, on, cards, loaded} = useAssistantFeed(serverUrl, channelId);
    const {following} = useAssistantPresence(serverUrl, channelId);
    const holderNames = useOfferHolderNames(serverUrl, cards);

    // The feed reads like a chat: oldest at the top (the store already sorts that way),
    // newest at the bottom, scrolled there on open. A new card keeps the reader pinned to
    // the bottom if they're already there; otherwise it shows a "New card ↓" chip instead of
    // yanking the list (ASSISTANT_DISPLAY.md), the same contract the channel's own post list
    // uses for its "new messages" indicator.
    const listRef = useRef<FlatList<AssistantCard>>(null);
    const [stuckToBottom, setStuckToBottom] = useState(true);
    const [showJumpChip, setShowJumpChip] = useState(false);
    const prevCardCount = useRef(0);

    const scrollToBottom = useCallback((animated: boolean) => {
        listRef.current?.scrollToEnd({animated});
    }, []);

    useEffect(() => {
        const hadCards = prevCardCount.current > 0;
        if (cards.length > prevCardCount.current) {
            if (stuckToBottom) {
                setShowJumpChip(false);
                requestAnimationFrame(() => scrollToBottom(hadCards));
            } else {
                setShowJumpChip(true);
            }
        } else if (cards.length <= prevCardCount.current && stuckToBottom) {
            setShowJumpChip(false);
        }
        prevCardCount.current = cards.length;
    }, [cards.length, stuckToBottom, scrollToBottom]);

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent;
        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
        const nowAtBottom = distanceFromBottom <= BOTTOM_THRESHOLD;
        setStuckToBottom(nowAtBottom);
        if (nowAtBottom) {
            setShowJumpChip(false);
        }
    }, []);

    const onJumpToBottom = usePreventDoubleTap(useCallback(() => {
        scrollToBottom(true);
        setStuckToBottom(true);
        setShowJumpChip(false);
    }, [scrollToBottom]));

    const onToggle = usePreventDoubleTap(useCallback(() => {
        setAssistantChannelEnabled(serverUrl, channelId, !on);
    }, [serverUrl, channelId, on]));

    const onOpenSettings = usePreventDoubleTap(useCallback(() => {
        const renderContent = () => (<MutedToolsSheet/>);
        bottomSheet(renderContent, [1, 420]);
    }, []));

    const onGoToMessage = useCallback((postId: string) => {
        showPermalink(serverUrl, '', postId);
    }, [serverUrl]);

    const onPost = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'post'));
        await postAssistantCard(serverUrl, channelId, card.id);
        setBusy(null);
    }, [serverUrl, channelId]);

    const onPin = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'pin'));
        await pinAssistantCard(serverUrl, channelId, card.id, !card.pinned);
        setBusy(null);
    }, [serverUrl, channelId]);

    const onDismiss = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'dismiss'));
        await dismissAssistantCard(serverUrl, channelId, card.id);
        setBusy(null);
    }, [serverUrl, channelId]);

    const onMute = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'mute'));
        await muteAssistantCard(serverUrl, channelId, card.id);
        setBusy(null);
    }, [serverUrl, channelId]);

    const onRun = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'run'));
        await runAssistantOffer(serverUrl, channelId, card.id);
        setBusy(null);
    }, [serverUrl, channelId]);

    const onClaim = useCallback(async (card: AssistantCard) => {
        setBusy(busyKey(card.id, 'claim'));
        await claimAssistantOffer(serverUrl, channelId, card.id);
        setBusy(null);
    }, [serverUrl, channelId]);

    const renderItem = useCallback(({item}: {item: AssistantCard}) => {
        const testID = `assistant.card.${item.id}`;
        if (item.kind === 'action') {
            return (
                <ActionCard
                    card={item}
                    holderName={item.offer?.holder_id ? holderNames[item.offer.holder_id] : undefined}
                    onRun={onRun}
                    onClaim={onClaim}
                    onDismiss={onDismiss}
                    onMute={onMute}
                    onGoToMessage={onGoToMessage}
                    busy={busy?.startsWith(`${item.id}.`) ? busy.slice(item.id.length + 1) : null}
                    testID={testID}
                />
            );
        }
        return (
            <InsightCard
                card={item}
                onPost={onPost}
                onPin={onPin}
                onDismiss={onDismiss}
                onMute={onMute}
                onGoToMessage={onGoToMessage}
                busy={busy?.startsWith(`${item.id}.`) ? busy.slice(item.id.length + 1) : null}
                testID={testID}
            />
        );
    }, [holderNames, onRun, onClaim, onDismiss, onMute, onGoToMessage, onPost, onPin, busy]);

    const toggleAccessibilityLabel = useMemo(
        () => intl.formatMessage(on ? messages.turnOff : messages.turnOn),
        [intl, on],
    );

    return (
        <SafeAreaView
            style={styles.flex}
            edges={['bottom', 'left', 'right']}
            testID='assistant.screen'
        >
            <View style={styles.topBar}>
                {following ? (
                    <FormattedText
                        id={messages.following.id}
                        defaultMessage={messages.following.defaultMessage}
                        style={styles.following}
                        testID='assistant.screen.following'
                    />
                ) : (
                    <View style={styles.following}/>
                )}
                <View style={styles.actions}>
                    <Pressable
                        accessibilityRole='switch'
                        accessibilityState={{checked: on}}
                        accessibilityLabel={toggleAccessibilityLabel}
                        onPress={onToggle}
                        style={styles.iconButton}
                        testID='assistant.screen.toggle'
                    >
                        <CompassIcon
                            name={on ? 'eye-outline' : 'eye-off-outline'}
                            style={[styles.icon, on && styles.iconOn]}
                        />
                    </Pressable>
                    <Pressable
                        accessibilityRole='button'
                        accessibilityLabel={intl.formatMessage(messages.settings)}
                        onPress={onOpenSettings}
                        style={styles.iconButton}
                        testID='assistant.screen.settings'
                    >
                        <CompassIcon
                            name='cog-outline'
                            style={styles.icon}
                        />
                    </Pressable>
                </View>
            </View>
            {!enabled && loaded ? (
                <View style={styles.centered}>
                    <FormattedText
                        id={messages.off.id}
                        defaultMessage={messages.off.defaultMessage}
                        style={styles.message}
                        testID='assistant.screen.off'
                    />
                </View>
            ) : (
                <View style={styles.listWrapper}>
                    <FlatList
                        ref={listRef}
                        data={cards}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.content}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        testID='assistant.screen.list'
                        ListEmptyComponent={loaded ? (
                            <View style={styles.centered}>
                                <FormattedText
                                    id={messages.empty.id}
                                    defaultMessage={messages.empty.defaultMessage}
                                    style={styles.message}
                                    testID='assistant.screen.empty'
                                />
                            </View>
                        ) : null}
                    />
                    {showJumpChip && (
                        <Pressable
                            accessibilityRole='button'
                            accessibilityLabel={intl.formatMessage(messages.newCard)}
                            onPress={onJumpToBottom}
                            style={styles.jumpChip}
                            testID='assistant.screen.jump_to_bottom'
                        >
                            <CompassIcon
                                name='arrow-down'
                                style={styles.jumpChipIcon}
                            />
                            <FormattedText
                                id={messages.newCard.id}
                                defaultMessage={messages.newCard.defaultMessage}
                                style={styles.jumpChipText}
                            />
                        </Pressable>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
};

export default AssistantScreen;
