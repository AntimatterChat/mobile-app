// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {type StyleProp, Text, View, type ViewStyle} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    title: string;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    icon: {color: changeOpacity(theme.centerChannelColor, 0.64)},
    title: {
        flexShrink: 1,
        color: theme.centerChannelColor,
        ...typography('Body', 100, 'SemiBold'),
    },
}));

// ThreadName is the name of a named thread, after the thread icon, as Fusion shows it under the thread's first message.
export default function ThreadName({title, style, testID = 'thread_name'}: Props) {
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    return (
        <View
            style={[styles.container, style]}
            testID={testID}
        >
            <CompassIcon
                name='message-text-outline'
                size={16}
                color={styles.icon.color}
            />
            <Text
                style={styles.title}
                numberOfLines={1}
            >
                {title}
            </Text>
        </View>
    );
}
