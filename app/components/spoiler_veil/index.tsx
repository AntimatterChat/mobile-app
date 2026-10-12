// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {type ReactNode} from 'react';
import {useIntl} from 'react-intl';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import CompassIcon from '@components/compass_icon';
import {useTheme} from '@context/theme';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    children: ReactNode;
    hidden: boolean;

    // When set, tapping the veil shows the spoiler; else the veil lets taps through to what holds it, which shows it.
    onShow?: () => void;
    testID?: string;
}

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        minHeight: 36,
        borderRadius: 6,
        overflow: 'hidden',
    },
    content: {opacity: 0},
    cover: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.16),
    },
    pressed: {backgroundColor: changeOpacity(theme.centerChannelColor, 0.24)},
    label: {
        color: changeOpacity(theme.centerChannelColor, 0.72),
        ...typography('Body', 100, 'SemiBold'),
    },
}));

// SpoilerVeil hides a spoiler's text and files in place until its reader taps it, as in Discord and Fusion: what it
// hides keeps its size under the cover, so that showing it moves nothing around it, but can't be seen, tapped or read
// out while hidden.
export default function SpoilerVeil({children, hidden, onShow, testID = 'spoiler_veil'}: Props) {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    if (!hidden) {
        return <>{children}</>;
    }

    const label = intl.formatMessage({id: 'spoiler.title', defaultMessage: 'Spoiler'});
    const a11yLabel = intl.formatMessage({id: 'spoiler.show', defaultMessage: 'Spoiler, tap to show it'});
    const cover = (
        <>
            <CompassIcon
                name='eye-off-outline'
                size={18}
                color={styles.label.color}
            />
            <Text style={styles.label}>{label}</Text>
        </>
    );

    return (
        <View
            style={styles.container}
            testID={testID}
        >
            <View
                style={styles.content}
                pointerEvents='none'
                accessibilityElementsHidden={true}
                importantForAccessibility='no-hide-descendants'
            >
                {children}
            </View>
            {onShow ? (
                <Pressable
                    style={({pressed}) => [styles.cover, pressed && styles.pressed]}
                    onPress={onShow}
                    accessibilityRole='button'
                    accessibilityLabel={a11yLabel}
                    testID={`${testID}.cover`}
                >
                    {cover}
                </Pressable>
            ) : (
                <View
                    style={styles.cover}
                    pointerEvents='none'
                    accessible={true}
                    accessibilityLabel={a11yLabel}
                    testID={`${testID}.cover`}
                >
                    {cover}
                </View>
            )}
        </View>
    );
}
