// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {Pressable, Text, View} from 'react-native';

import {savePreference} from '@actions/remote/preference';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import useDidUpdate from '@hooks/did_update';
import {useInlineReply} from '@hooks/inline_reply';
import {observeMentionsQuotedAuthor} from '@queries/servers/inline_reply';
import {observeCurrentUserId} from '@queries/servers/system';
import {getQuoted, MENTION_PREFERENCE_CATEGORY, MENTION_PREFERENCE_NAME, type QuotedFile} from '@utils/inline_reply';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useQuotedAuthorName} from './quoted_author';
import QuotedSnippet from './quoted_snippet';
import {withQuoted} from './with_quoted';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

const hitSlop = {top: 8, bottom: 8, left: 8, right: 8};

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginHorizontal: 12,
        paddingTop: 8,
    },
    label: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
    },
    name: {
        color: theme.centerChannelColor,
        ...typography('Body', 75, 'SemiBold'),
        flexShrink: 0,
        maxWidth: '35%',
    },
    snippet: {
        color: changeOpacity(theme.centerChannelColor, 0.64),
        ...typography('Body', 75),
        flexShrink: 1,
    },
    deleted: {fontStyle: 'italic'},
    quote: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    mention: {
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: changeOpacity(theme.buttonBg, 0.12),
    },
    mentionOff: {backgroundColor: changeOpacity(theme.centerChannelColor, 0.08)},
    mentionText: {
        color: theme.buttonBg,
        ...typography('Body', 75, 'SemiBold'),
    },
    mentionTextOff: {color: changeOpacity(theme.centerChannelColor, 0.64)},
    pressed: {opacity: 0.72},
}));

type BarProps = {
    quotedId: string;
    mention: boolean;
    currentUserId: string;
    onCancel: () => void;

    // From withQuoted
    quotedPost?: PostModel;
    quotedFiles: QuotedFile[];
    author?: UserModel;
    teammateNameDisplay: string;
    overrideAllowed: boolean;
};

// Bar is Fusion's "↩ Replying to Name snippet", with its "@" switch and a button to cancel the reply.
export function Bar({quotedId, mention, currentUserId, onCancel, quotedPost, quotedFiles, author, teammateNameDisplay, overrideAllowed}: BarProps) {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const quoted = getQuoted(quotedId, quotedPost, quotedFiles);
    const who = useQuotedAuthorName(quoted, author, teammateNameDisplay, overrideAllowed);

    // The switch isn't shown when no one would be notified: replying to yourself, to a deleted message or to a
    // webhook's message.
    const showMention = Boolean(quoted.userId) && quoted.userId !== currentUserId && !quoted.deleted && !quoted.fromWebhook;

    const toggleMention = useCallback(() => {
        savePreference(serverUrl, [{
            user_id: currentUserId,
            category: MENTION_PREFERENCE_CATEGORY,
            name: MENTION_PREFERENCE_NAME,
            value: String(!mention),
        }]);
    }, [serverUrl, currentUserId, mention]);

    const mentionLabel = mention ? intl.formatMessage({id: 'inline_reply.mention', defaultMessage: '{name} will be notified of your reply. Tap to turn off.'}, {name: who}) : intl.formatMessage({id: 'inline_reply.no_mention', defaultMessage: "{name} won't be notified of your reply. Tap to turn on."}, {name: who});

    return (
        <View
            style={styles.container}
            testID='inline_reply.bar'
        >
            <CompassIcon
                name='reply-outline'
                size={16}
                color={styles.label.color}
            />
            <View style={styles.quote}>
                <FormattedText
                    id='inline_reply.replying_to'
                    defaultMessage='Replying to'
                    style={styles.label}
                />
                {Boolean(who) && (
                    <Text
                        style={styles.name}
                        numberOfLines={1}
                    >
                        {who}
                    </Text>
                )}
                <QuotedSnippet
                    quoted={quoted}
                    variant='bar'
                    style={styles.snippet}
                    deletedStyle={styles.deleted}
                    iconColor={styles.snippet.color}
                />
            </View>
            {showMention && (
                <Pressable
                    onPress={toggleMention}
                    hitSlop={hitSlop}
                    style={({pressed}) => [styles.mention, !mention && styles.mentionOff, pressed && styles.pressed]}
                    accessibilityRole='switch'
                    accessibilityState={{checked: mention}}
                    accessibilityLabel={mentionLabel}
                    testID='inline_reply.bar.mention'
                >
                    <Text style={[styles.mentionText, !mention && styles.mentionTextOff]}>
                        {mention ? intl.formatMessage({id: 'inline_reply.mention_on', defaultMessage: '@ On'}) : intl.formatMessage({id: 'inline_reply.mention_off', defaultMessage: '@ Off'})}
                    </Text>
                </Pressable>
            )}
            <Pressable
                onPress={onCancel}
                hitSlop={hitSlop}
                style={({pressed}) => pressed && styles.pressed}
                accessibilityRole='button'
                accessibilityLabel={intl.formatMessage({id: 'inline_reply.cancel', defaultMessage: 'Cancel reply'})}
                testID='inline_reply.bar.cancel'
            >
                <CompassIcon
                    name='close'
                    size={18}
                    color={styles.label.color}
                />
            </Pressable>
        </View>
    );
}

const EnhancedBar = withDatabase(withQuoted(Bar));

type Props = {
    channelId: string;
    rootId: string;
    focus: () => void;
    mention: boolean;
    currentUserId: string;
};

// ReplyBar shows, over the composer, the message it replies to inline, if any. Choosing one to reply to brings the
// keyboard up.
function ReplyBar({channelId, rootId, focus, mention, currentUserId}: Props) {
    const serverUrl = useServerUrl();
    const [quotedId, setQuotedId] = useInlineReply(serverUrl, channelId, rootId);

    useDidUpdate(() => {
        if (quotedId) {
            focus();
        }
    }, [quotedId]);

    const cancel = useCallback(() => setQuotedId(''), [setQuotedId]);

    if (!quotedId) {
        return null;
    }

    return (
        <EnhancedBar
            quotedId={quotedId}
            mention={mention}
            currentUserId={currentUserId}
            onCancel={cancel}
        />
    );
}

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => ({
    mention: observeMentionsQuotedAuthor(database),
    currentUserId: observeCurrentUserId(database),
}));

export default withDatabase(enhanced(ReplyBar));
