// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import {muteChannelFor, unmuteChannel} from '@actions/remote/timed_mute';
import OptionBox from '@components/option_box';
import {useServerUrl} from '@context/server';
import {dismissBottomSheet} from '@screens/navigation';
import {showMuteChannelSnackbar} from '@utils/snack_bar';

import {showMuteDurations} from './mute_durations';

import type {StyleProp, ViewStyle} from 'react-native';

type Props = {
    channelId: string;
    containerStyle?: StyleProp<ViewStyle>;
    isMuted: boolean;
    showSnackBar?: boolean;
    testID?: string;
}

const MutedBox = ({channelId, containerStyle, isMuted, showSnackBar = false, testID}: Props) => {
    const intl = useIntl();
    const serverUrl = useServerUrl();

    // Muting asks for how long, as in Fusion; unmuting also forgets when a timed mute was to end.
    const handleOnPress = useCallback(async () => {
        await dismissBottomSheet();
        if (!isMuted) {
            showMuteDurations(channelId, showSnackBar);
            return;
        }
        const {error} = await unmuteChannel(serverUrl, channelId);
        if (!error && showSnackBar) {
            showMuteChannelSnackbar(false, () => muteChannelFor(serverUrl, channelId, 0));
        }
    }, [channelId, isMuted, serverUrl, showSnackBar]);

    const muteActionTestId = isMuted ? `${testID}.unmute.action` : `${testID}.mute.action`;

    return (
        <OptionBox
            activeIconName={isMuted ? 'bell-off-outline' : undefined}
            activeText={isMuted ? intl.formatMessage({id: 'channel_info.muted', defaultMessage: 'Muted'}) : undefined}
            containerStyle={containerStyle}
            iconName='bell-outline'
            isActive={isMuted}
            onPress={handleOnPress}
            testID={muteActionTestId}
            text={intl.formatMessage({id: 'channel_info.muted', defaultMessage: 'Mute'})}
        />
    );
};

export default MutedBox;
