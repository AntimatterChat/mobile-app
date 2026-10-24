// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';

import CompassIcon from '@components/compass_icon';
import PressableOpacity from '@components/pressable_opacity';
import {Screens} from '@constants';
import {ICON_SIZE} from '@constants/post_draft';
import {useKeyboardState} from '@context/keyboard_state';
import {useTheme} from '@context/theme';
import {navigateToScreen} from '@screens/navigation';
import CallbackStore from '@store/callback_store';
import {changeOpacity} from '@utils/theme';

import {style} from '../post_priority_action';

type Props = {
    testId?: string;
    postBoRConfig?: PostBoRConfig;
    updatePostBoRStatus: (config: PostBoRConfig) => void;
    defaultBorConfig: PostBoRConfig;
}

// BoRQuickAction opens the burn-on-read duration picker: off, a stepped duration, or a custom one, capped by the
// administrator's maximum. One tap, one place, same pattern as the message priority picker.
export default function BoRQuickAction({testId, defaultBorConfig, postBoRConfig, updatePostBoRStatus}: Props) {
    const theme = useTheme();
    const {blurAndDismissKeyboard} = useKeyboardState();
    const iconColor = postBoRConfig?.enabled ? theme.buttonBg : changeOpacity(theme.centerChannelColor, 0.64);

    const onPress = useCallback(async () => {
        await blurAndDismissKeyboard();
        CallbackStore.setCallback(updatePostBoRStatus);
        navigateToScreen(Screens.BURN_DURATION_PICKER, {
            postBoRConfig: postBoRConfig || defaultBorConfig,
            defaultBorConfig,
        });
    }, [blurAndDismissKeyboard, defaultBorConfig, postBoRConfig, updatePostBoRStatus]);

    return (
        <PressableOpacity
            style={style.icon}
            onPress={onPress}
        >
            <CompassIcon
                testID={testId}
                name={'fire'}
                size={ICON_SIZE}
                color={iconColor}
            />
        </PressableOpacity>
    );
}
