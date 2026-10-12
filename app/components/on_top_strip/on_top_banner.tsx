// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {defineMessages, useIntl} from 'react-intl';
import {Pressable, Text, View} from 'react-native';

import {showPermalink} from '@actions/remote/permalink';
import {fetchMissingProfilesByIds} from '@actions/remote/user';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import RemoveMarkdown from '@components/remove_markdown';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {useDefaultHeaderHeight} from '@hooks/header';
import {usePreventDoubleTap} from '@hooks/utils';
import {observePost} from '@queries/servers/post';
import {observeTeammateNameDisplay, observeUser} from '@queries/servers/user';
import {onTopMessages, timeLeft} from '@utils/on_top';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';
import {displayUsername} from '@utils/user';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

const messages = defineMessages({
    by: {id: 'mobile.on_top.by', defaultMessage: '· put on top by {name}'},
    byYou: {id: 'mobile.on_top.by_you', defaultMessage: '· put on top by you'},
    jump: {id: 'mobile.on_top.jump', defaultMessage: 'Jump'},
    previous: {id: 'mobile.on_top.previous', defaultMessage: 'Previous'},
    next: {id: 'mobile.on_top.next', defaultMessage: 'Next'},
    position: {id: 'mobile.on_top.position', defaultMessage: '{current}/{count}'},
    region: {id: 'mobile.on_top.region', defaultMessage: 'On top of this channel'},
    noText: {id: 'mobile.on_top.no_text', defaultMessage: 'View the message'},
});

// Up to this many lines of the message show; tapping it shows all of it.
const MAX_LINES = 2;

const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        zIndex: 1,
        backgroundColor: theme.centerChannelBg,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 6,
        borderBottomWidth: 1,
        borderBottomColor: changeOpacity(theme.centerChannelColor, 0.08),
        gap: 4,
    },
    topItem: {
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    icon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: changeOpacity(theme.buttonBg, 0.12),
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    body: {
        flex: 1,
    },
    meta: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    author: {
        color: theme.centerChannelColor,
        ...typography('Body', 75, 'SemiBold'),
    },
    text: {
        color: theme.centerChannelColor,
        ...typography('Body', 100),
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 38,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    leftText: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    navText: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75, 'SemiBold'),
    },
    jump: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: changeOpacity(theme.buttonBg, 0.08),
    },
    jumpText: {
        color: theme.buttonBg,
        ...typography('Body', 75, 'SemiBold'),
    },
    pressed: {
        opacity: 0.72,
    },
}));

type NamesProps = {
    author?: UserModel;
    by?: UserModel;
    byMe: boolean;
    teammateNameDisplay: string;
};

const OnTopNamesComponent = ({author, by, byMe, teammateNameDisplay}: NamesProps) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const authorName = displayUsername(author, intl.locale, teammateNameDisplay);
    const byText = byMe ? intl.formatMessage(messages.byYou) : intl.formatMessage(messages.by, {name: displayUsername(by, intl.locale, teammateNameDisplay)});

    return (
        <Text
            style={styles.meta}
            numberOfLines={1}
        >
            <Text style={styles.author}>{authorName}</Text>
            {` ${byText}`}
        </Text>
    );
};

const OnTopNames = withDatabase(withObservables(['authorId', 'byId'], ({database, authorId, byId}: WithDatabaseArgs & {authorId: string; byId: string}) => ({
    author: observeUser(database, authorId),
    by: observeUser(database, byId),
    teammateNameDisplay: observeTeammateNameDisplay(database),
}))(OnTopNamesComponent));

type Props = {
    canRemove: boolean;
    count: number;
    currentUserId: string;
    entry: OnTopPost;
    fetchedPost?: Post;
    go: (step: number) => void;
    index: number;
    isTopItem: boolean;
    now: number;
    onMissing: (postId: string) => void;
    onRemove: () => void;
    post?: PostModel;
    postId: string;
};

const OnTopBanner = ({canRemove, count, currentUserId, entry, fetchedPost, go, index, isTopItem, now, onMissing, onRemove, post}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const defaultHeight = useDefaultHeaderHeight();
    const [open, setOpen] = useState(false);

    const message = post?.message ?? fetchedPost?.message ?? '';
    const authorId = post?.userId ?? fetchedPost?.user_id ?? '';
    const deleted = Boolean(post?.deleteAt);

    // A message deleted while on top is left out (the server takes it off the top too)
    useEffect(() => {
        if (deleted) {
            onMissing(entry.post_id);
        }
    }, [deleted, entry.post_id, onMissing]);

    // The author and who put it on top may not be loaded yet
    useEffect(() => {
        const ids = [authorId, entry.created_by].filter(Boolean);
        if (ids.length) {
            fetchMissingProfilesByIds(serverUrl, ids);
        }
    }, [serverUrl, authorId, entry.created_by]);

    useEffect(() => {
        setOpen(false);
    }, [entry.post_id]);

    const containerStyle = useMemo(() => [styles.container, {top: defaultHeight}, isTopItem && styles.topItem], [styles, defaultHeight, isTopItem]);

    const jump = usePreventDoubleTap(useCallback(() => {
        showPermalink(serverUrl, '', entry.post_id);
    }, [serverUrl, entry.post_id]));

    const toggle = useCallback(() => setOpen((o) => !o), []);
    const previous = useCallback(() => go(-1), [go]);
    const next = useCallback(() => go(1), [go]);

    if (deleted || (!post && !fetchedPost)) {
        return null;
    }

    return (
        <View
            style={containerStyle}
            accessibilityLabel={intl.formatMessage(messages.region)}
            testID='channel.on_top_strip'
        >
            <View style={styles.row}>
                <View style={styles.icon}>
                    <CompassIcon
                        name='pin-outline'
                        size={16}
                        color={theme.buttonBg}
                    />
                </View>
                <View style={styles.body}>
                    <OnTopNames
                        authorId={authorId}
                        byId={entry.created_by}
                        byMe={entry.created_by === currentUserId}
                    />
                    <Pressable
                        onPress={toggle}
                        testID='channel.on_top_strip.text'
                    >
                        {message ? (
                            <RemoveMarkdown
                                value={message}
                                baseStyle={styles.text}
                                numberOfLines={open ? undefined : MAX_LINES}
                            />
                        ) : (
                            <FormattedText
                                {...messages.noText}
                                style={styles.text}
                            />
                        )}
                    </Pressable>
                </View>
            </View>
            <View style={styles.actions}>
                <View style={styles.left}>
                    <CompassIcon
                        name='clock-outline'
                        size={14}
                        color={changeOpacity(theme.centerChannelColor, 0.64)}
                    />
                    <Text
                        style={styles.leftText}
                        numberOfLines={1}
                    >
                        {timeLeft(intl, entry.expires_at, now)}
                    </Text>
                </View>
                {count > 1 && (
                    <View style={styles.nav}>
                        <Pressable
                            accessibilityLabel={intl.formatMessage(messages.previous)}
                            hitSlop={hitSlop}
                            onPress={previous}
                            style={({pressed}) => pressed && styles.pressed}
                            testID='channel.on_top_strip.previous'
                        >
                            <CompassIcon
                                name='chevron-left'
                                size={20}
                                color={changeOpacity(theme.centerChannelColor, 0.64)}
                            />
                        </Pressable>
                        <Text style={styles.navText}>
                            {intl.formatMessage(messages.position, {current: index + 1, count})}
                        </Text>
                        <Pressable
                            accessibilityLabel={intl.formatMessage(messages.next)}
                            hitSlop={hitSlop}
                            onPress={next}
                            style={({pressed}) => pressed && styles.pressed}
                            testID='channel.on_top_strip.next'
                        >
                            <CompassIcon
                                name='chevron-right'
                                size={20}
                                color={changeOpacity(theme.centerChannelColor, 0.64)}
                            />
                        </Pressable>
                    </View>
                )}
                <Pressable
                    onPress={jump}
                    style={({pressed}) => [styles.jump, pressed && styles.pressed]}
                    testID='channel.on_top_strip.jump'
                >
                    <FormattedText
                        {...messages.jump}
                        style={styles.jumpText}
                    />
                </Pressable>
                {canRemove && (
                    <Pressable
                        accessibilityLabel={intl.formatMessage(onTopMessages.remove)}
                        hitSlop={hitSlop}
                        onPress={onRemove}
                        style={({pressed}) => pressed && styles.pressed}
                        testID='channel.on_top_strip.remove'
                    >
                        <CompassIcon
                            name='close'
                            size={18}
                            color={changeOpacity(theme.centerChannelColor, 0.64)}
                        />
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const enhanced = withObservables(['postId'], ({database, postId}: WithDatabaseArgs & {postId: string}) => ({
    post: observePost(database, postId),
}));

export default withDatabase(enhanced(OnTopBanner));
