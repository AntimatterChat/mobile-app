// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {Pressable, Text, View} from 'react-native';

import {showPermalink} from '@actions/remote/permalink';
import CompassIcon from '@components/compass_icon';
import ProfilePicture from '@components/profile_picture';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {observeInlineRepliesEnabled} from '@queries/servers/inline_reply';
import {getQuoted, replyToId, type QuotedFile} from '@utils/inline_reply';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {useQuotedAuthorName} from './quoted_author';
import QuotedSnippet, {quotedText} from './quoted_snippet';
import {withQuoted} from './with_quoted';

import type {WithDatabaseArgs} from '@typings/database/database';
import type PostModel from '@typings/database/models/servers/post';
import type UserModel from '@typings/database/models/servers/user';

const AVATAR_SIZE = 16;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,

        // The spine starts above the middle of the reply's picture (32 px wide).
        marginLeft: 15,
        paddingRight: 8,
    },
    pressed: {opacity: 0.72},
    spine: {
        alignSelf: 'stretch',
        width: 22,
        marginTop: 9,
        marginBottom: -10,
        borderLeftWidth: 2,
        borderTopWidth: 2,
        borderTopLeftRadius: 6,
        borderColor: changeOpacity(theme.centerChannelColor, 0.24),
    },
    noAvatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
    },
    name: {
        color: changeOpacity(theme.centerChannelColor, 0.88),
        ...typography('Body', 75, 'SemiBold'),
        flexShrink: 0,
        maxWidth: '45%',
    },
    snippet: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 75),
        flexShrink: 1,
    },
    deleted: {fontStyle: 'italic'},
}));

type QuotedRefProps = {
    quotedId: string;
    described?: PostReplyTo;

    // From withQuoted
    quotedPost?: PostModel;
    quotedFiles: QuotedFile[];
    author?: UserModel;
    teammateNameDisplay: string;
    overrideAllowed: boolean;
};

// QuotedRef is the reference line above an inline reply, as in Discord and Fusion: the quoted author's small picture
// and name, then the start of their message. Tapping it shows the quoted message in its conversation.
export function QuotedRef({quotedId, described, quotedPost, quotedFiles, author, teammateNameDisplay, overrideAllowed}: QuotedRefProps) {
    const intl = useIntl();
    const theme = useTheme();
    const serverUrl = useServerUrl();
    const styles = getStyleSheet(theme);
    const quoted = getQuoted(quotedId, quotedPost, quotedFiles, described);
    const who = useQuotedAuthorName(quoted, author, teammateNameDisplay, overrideAllowed);

    const onPress = usePreventDoubleTap(useCallback(() => {
        showPermalink(serverUrl, '', quotedId);
    }, [serverUrl, quotedId]));

    const text = quotedText(intl, quoted, 'ref');
    const a11yLabel = who ? intl.formatMessage({id: 'inline_reply.replying_to_name', defaultMessage: 'Replying to {name}: {text}'}, {name: who, text}) : intl.formatMessage({id: 'inline_reply.replying_to_text', defaultMessage: 'Replying to: {text}'}, {text});

    return (
        <Pressable
            onPress={onPress}
            disabled={quoted.deleted}
            style={({pressed}) => [styles.container, pressed && styles.pressed]}
            accessibilityRole={quoted.deleted ? 'text' : 'link'}
            accessibilityLabel={a11yLabel}
            testID={`inline_reply.ref.${quotedId}`}
        >
            <View style={styles.spine}/>
            {quoted.deleted || !author ? (
                <View style={styles.noAvatar}>
                    <CompassIcon
                        name='reply-outline'
                        size={11}
                        color={styles.snippet.color}
                    />
                </View>
            ) : (
                <ProfilePicture
                    author={author}
                    size={AVATAR_SIZE}
                    showStatus={false}
                />
            )}
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
                variant='ref'
                style={styles.snippet}
                deletedStyle={styles.deleted}
                iconColor={styles.snippet.color}
            />
        </Pressable>
    );
}

const EnhancedQuotedRef = withDatabase(withQuoted(QuotedRef));

type Props = {
    post: PostModel;
    enabled: boolean;
};

// InlineReplyRef quotes, above a post, the message it replies to inline, when it does and the server allows it.
function InlineReplyRef({post, enabled}: Props) {
    const quotedId = replyToId(post);
    if (!enabled || !quotedId) {
        return null;
    }
    const described = post.metadata?.reply_to;
    return (
        <EnhancedQuotedRef
            quotedId={quotedId}
            described={described}
            describedUserId={described?.user_id}
        />
    );
}

const enhanced = withObservables([], ({database}: WithDatabaseArgs) => ({
    enabled: observeInlineRepliesEnabled(database),
}));

export default withDatabase(enhanced(InlineReplyRef));
