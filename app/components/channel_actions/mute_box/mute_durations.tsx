// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import {muteChannelFor, unmuteChannel} from '@actions/remote/timed_mute';
import OptionItem, {ITEM_HEIGHT} from '@components/option_item';
import {useServerUrl} from '@context/server';
import BottomSheetContent, {TITLE_HEIGHT} from '@screens/bottom_sheet/content';
import {bottomSheet, dismissBottomSheet} from '@screens/navigation';
import {bottomSheetSnapPoint} from '@utils/helpers';
import {showMuteChannelSnackbar} from '@utils/snack_bar';
import {MUTE_DURATIONS} from '@utils/timed_mute';

type Props = {
    channelId: string;
    showSnackBar: boolean;
}

// MuteDurations offers to mute a channel for a while, or until unmuted, as Fusion's channel menu does.
function MuteDurations({channelId, showSnackBar}: Props) {
    const intl = useIntl();
    const serverUrl = useServerUrl();

    return (
        <BottomSheetContent
            showButton={false}
            showTitle={true}
            title={intl.formatMessage({id: 'timed_mute.title', defaultMessage: 'Mute channel'})}
            testID='mute_durations'
        >
            {MUTE_DURATIONS.map(([duration, message]) => (
                <OptionItem
                    key={duration}
                    action={async () => {
                        await dismissBottomSheet();
                        const {error} = await muteChannelFor(serverUrl, channelId, duration);
                        if (!error && showSnackBar) {
                            showMuteChannelSnackbar(true, () => unmuteChannel(serverUrl, channelId));
                        }
                    }}
                    label={intl.formatMessage(message)}
                    testID={`mute_durations.${duration}`}
                    type='default'
                />
            ))}
        </BottomSheetContent>
    );
}

export function showMuteDurations(channelId: string, showSnackBar: boolean) {
    bottomSheet(
        () => (
            <MuteDurations
                channelId={channelId}
                showSnackBar={showSnackBar}
            />
        ),
        [1, bottomSheetSnapPoint(MUTE_DURATIONS.length, ITEM_HEIGHT) + TITLE_HEIGHT],
    );
}

export default MuteDurations;
