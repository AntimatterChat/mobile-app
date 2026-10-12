// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {useIntl} from 'react-intl';

import CompassIcon from '@components/compass_icon';
import TouchableWithFeedback from '@components/touchable_with_feedback';
import {ICON_SIZE} from '@constants/post_draft';
import {useTheme} from '@context/theme';
import {changeOpacity} from '@utils/theme';

import {style} from '../post_priority_action';

type Props = {
    testID?: string;
    isSpoiler: boolean;
    updateSpoiler: (spoiler: boolean) => void;
}

// SpoilerQuickAction sends the draft as a spoiler, or not, as the composer's eye button of Fusion does.
export default function SpoilerQuickAction({testID, isSpoiler, updateSpoiler}: Props) {
    const theme = useTheme();
    const intl = useIntl();

    const onPress = useCallback(() => {
        updateSpoiler(!isSpoiler);
    }, [isSpoiler, updateSpoiler]);

    return (
        <TouchableWithFeedback
            testID={testID}
            onPress={onPress}
            style={style.icon}
            type={'opacity'}
            accessibilityRole='switch'
            accessibilityState={{checked: isSpoiler}}
            accessibilityLabel={intl.formatMessage({id: 'post_draft.spoiler', defaultMessage: 'Send as a spoiler'})}
        >
            <CompassIcon
                name='eye-off-outline'
                color={isSpoiler ? theme.buttonBg : changeOpacity(theme.centerChannelColor, 0.64)}
                size={ICON_SIZE}
            />
        </TouchableWithFeedback>
    );
}
