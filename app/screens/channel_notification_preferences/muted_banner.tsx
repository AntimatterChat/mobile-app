// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {View} from 'react-native';
import Animated, {FlipOutXUp} from 'react-native-reanimated';

import {unmuteChannel} from '@actions/remote/timed_mute';
import Button from '@components/button';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {useMuteEnd} from '@hooks/timed_mute';
import {usePreventDoubleTap} from '@hooks/utils';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

type Props = {
    channelId: string;
}

export const MUTED_BANNER_HEIGHT = 200;

// As Fusion says when a timed mute ends: "Fri 3:00 PM".
const MUTE_END_FORMAT = {weekday: 'short', hour: 'numeric', minute: '2-digit'} as const;

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    button: {width: '55%'},
    container: {
        backgroundColor: changeOpacity(theme.sidebarTextActiveBorder, 0.16),
        borderRadius: 4,
        marginVertical: 12,
        paddingHorizontal: 16,
        height: MUTED_BANNER_HEIGHT,
    },
    contentText: {
        ...typography('Body', 200),
        color: theme.centerChannelColor,
        marginTop: 12,
        marginBottom: 16,
    },
    titleContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 16,
    },
    title: {
        ...typography('Heading', 200),
        color: theme.centerChannelColor,
        marginLeft: 10,
        paddingTop: 5,
    },
}));

const MutedBanner = ({channelId}: Props) => {
    const {formatMessage, formatDate} = useIntl();
    const serverUrl = useServerUrl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);

    // A timed mute says when it ends.
    const muteEnd = useMuteEnd(channelId);

    const onPress = usePreventDoubleTap(useCallback(() => {
        unmuteChannel(serverUrl, channelId);
    }, [channelId, serverUrl]));

    return (
        <Animated.View
            exiting={FlipOutXUp}
            style={styles.container}
        >
            <View style={styles.titleContainer}>
                <CompassIcon
                    name='bell-off-outline'
                    size={24}
                    color={theme.linkColor}
                />
                {muteEnd ? (
                    <FormattedText
                        id='channel_notification_preferences.muted_until_title'
                        defaultMessage='Muted until {time}'
                        values={{time: formatDate(muteEnd, MUTE_END_FORMAT)}}
                        style={styles.title}
                        testID='channel_notification_preferences.muted_until'
                    />
                ) : (
                    <FormattedText
                        id='channel_notification_preferences.muted_title'
                        defaultMessage='This channel is muted'
                        style={styles.title}
                    />
                )}
            </View>
            <FormattedText
                id='channel_notification_preferences.muted_content'
                defaultMessage='You can change the notification settings, but you will not receive notifications until the channel is unmuted.'
                style={styles.contentText}
            />
            <View style={styles.button}>
                <Button
                    onPress={onPress}
                    text={formatMessage({
                        id: 'channel_notification_preferences.unmute_content',
                        defaultMessage: 'Unmute channel',
                    })}
                    theme={theme}
                    iconName='bell-outline'
                />
            </View>
        </Animated.View>
    );
};

export default MutedBanner;
