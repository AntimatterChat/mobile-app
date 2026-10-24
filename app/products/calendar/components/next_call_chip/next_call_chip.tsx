// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';
import {Pressable, Text} from 'react-native';

import {showPermalink} from '@actions/remote/permalink';
import {usePluginEnabled} from '@am_plugins/hooks/composer_actions';
import {joinCallAndOpenCallScreen} from '@calls/actions/calls';
import CompassIcon from '@components/compass_icon';
import {useServerUrl} from '@context/server';
import {useTheme} from '@context/theme';
import {usePreventDoubleTap} from '@hooks/utils';
import {isTypeDMorGM} from '@utils/channel';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {typography} from '@utils/typography';

import {CALENDAR_PLUGIN_ID} from '../../constants';
import {useNextMeeting} from '../../hooks/use_next_meeting';
import {chipJoinLabel, describeChip} from '../../utils/chip';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        gap: 6,
    },
    icon: {
        color: changeOpacity(theme.sidebarHeaderTextColor, 0.72),
        fontSize: 14,
    },
    label: {
        flex: 1,
        color: changeOpacity(theme.sidebarHeaderTextColor, 0.88),
        ...typography('Body', 75, 'SemiBold'),
    },
    liveLabel: {
        color: theme.sidebarHeaderTextColor,
    },
    joinButton: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: changeOpacity(theme.sidebarHeaderTextColor, 0.16),
    },
    joinLabel: {
        color: theme.sidebarHeaderTextColor,
        ...typography('Body', 75, 'SemiBold'),
    },
}));

type Props = {
    channelId: string;
    channelType?: ChannelType;
    canJoinCalls: boolean;
};

const NextCallChip = ({channelId, channelType, canJoinCalls}: Props) => {
    const intl = useIntl();
    const theme = useTheme();
    const styles = getStyleSheet(theme);
    const serverUrl = useServerUrl();
    const calendarEnabled = usePluginEnabled(CALENDAR_PLUGIN_ID);
    const enabled = calendarEnabled && !isTypeDMorGM(channelType) && Boolean(channelId);
    const {next, now} = useNextMeeting(channelId, enabled);

    const onPress = usePreventDoubleTap(useCallback(() => {
        if (!next) {
            return;
        }
        showPermalink(serverUrl, '', next.post_id);
    }, [serverUrl, next]));

    const onJoin = usePreventDoubleTap(useCallback(() => {
        joinCallAndOpenCallScreen(intl, serverUrl, channelId);
    }, [intl, serverUrl, channelId]));

    if (!enabled || !next) {
        return null;
    }

    const {phase, label} = describeChip(next, now, intl);
    const showJoin = phase === 'live' && canJoinCalls;

    return (
        <Pressable
            accessibilityRole='button'
            accessibilityLabel={label}
            onPress={onPress}
            style={styles.container}
            testID='channel_header.next_call_chip'
        >
            <CompassIcon
                name='calendar-outline'
                style={styles.icon}
            />
            <Text
                numberOfLines={1}
                style={[styles.label, phase === 'live' && styles.liveLabel]}
                testID='channel_header.next_call_chip.label'
            >
                {label}
            </Text>
            {showJoin && (
                <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={intl.formatMessage(chipJoinLabel)}
                    onPress={onJoin}
                    style={styles.joinButton}
                    testID='channel_header.next_call_chip.join'
                >
                    <Text style={styles.joinLabel}>{intl.formatMessage(chipJoinLabel)}</Text>
                </Pressable>
            )}
        </Pressable>
    );
};

export default NextCallChip;
