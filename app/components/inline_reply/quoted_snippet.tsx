// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl, type IntlShape} from 'react-intl';
import {type StyleProp, Text, type TextStyle, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {plainText, quotedIcon, type Quoted} from '@utils/inline_reply';

type Props = {
    quoted: Quoted;

    // Above a reply ('ref'), a message with nothing to show but files invites to open it; in the composer's reply bar
    // ('bar'), it says what it holds.
    variant: 'ref' | 'bar';
    style: StyleProp<TextStyle>;
    deletedStyle: StyleProp<TextStyle>;
    iconColor: string;
}

export function quotedText(intl: IntlShape, quoted: Quoted, variant: 'ref' | 'bar') {
    const onlyImages = quoted.imageCount > 0 && quoted.imageCount === quoted.fileCount;
    if (quoted.deleted) {
        return intl.formatMessage({id: 'inline_reply.deleted', defaultMessage: 'Original message was deleted'});
    }
    if (quoted.spoiler) {
        return intl.formatMessage({id: 'spoiler.title', defaultMessage: 'Spoiler'});
    }
    if (quoted.message.trim()) {
        return plainText(quoted.message, 160);
    }
    if (variant === 'bar') {
        if (onlyImages) {
            return intl.formatMessage({id: 'inline_reply.images', defaultMessage: '{count, plural, one {# image} other {# images}}'}, {count: quoted.imageCount});
        }
        if (quoted.fileCount) {
            return intl.formatMessage({id: 'inline_reply.files', defaultMessage: '{count, plural, one {# file} other {# files}}'}, {count: quoted.fileCount});
        }
        return intl.formatMessage({id: 'inline_reply.a_message', defaultMessage: 'a message'});
    }
    if (onlyImages) {
        return intl.formatMessage({id: 'inline_reply.see_images', defaultMessage: 'Tap to see {count, plural, one {image} other {images}}'}, {count: quoted.imageCount});
    }
    if (quoted.fileCount) {
        return intl.formatMessage({id: 'inline_reply.see_attachment', defaultMessage: 'Tap to see attachment'});
    }
    return intl.formatMessage({id: 'inline_reply.see_message', defaultMessage: 'Tap to see message'});
}

const rowStyle = {flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1} as const;

// QuotedSnippet is the start of a quoted message's text, after the icon of what it holds besides text.
export default function QuotedSnippet({quoted, variant, style, deletedStyle, iconColor}: Props) {
    const intl = useIntl();
    const icon = quotedIcon(quoted);
    const text = (
        <Text
            style={[style, quoted.deleted && deletedStyle]}
            numberOfLines={1}
            testID='inline_reply.snippet'
        >
            {quotedText(intl, quoted, variant)}
        </Text>
    );

    if (!icon) {
        return text;
    }

    return (
        <View style={rowStyle}>
            <CompassIcon
                name={icon}
                size={14}
                color={iconColor}
            />
            {text}
        </View>
    );
}
