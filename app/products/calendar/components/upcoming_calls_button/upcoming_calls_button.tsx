// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useMemo} from 'react';
import {TouchableOpacity, View} from 'react-native';

import {getStyleSheet as getChannelItemStyleSheet, ROW_HEIGHT, textStyle as channelItemTextStyle} from '@components/channel_item/channel_item';
import CompassIcon from '@components/compass_icon';
import FormattedText from '@components/formatted_text';
import {HOME_PADDING} from '@constants/view';
import {useTheme} from '@context/theme';
import {useIsTablet} from '@hooks/device';
import {usePreventDoubleTap} from '@hooks/utils';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import {useAnyMeetingLive} from '../../hooks/use_any_meeting_live';
import {goToUpcomingCalls} from '../../screens/navigation';

const getStyleSheet = makeStyleSheetFromTheme((theme: Theme) => ({
    icon: {
        color: changeOpacity(theme.sidebarText, 0.5),
        fontSize: 24,
        marginRight: 12,
    },
    iconActive: {
        color: theme.sidebarText,
    },
    text: {
        flex: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.dndIndicator,
        marginLeft: 8,
    },
}));

type Props = {
    shouldHighlightActive?: boolean;
    teamId?: string;
};

const UpcomingCallsButton = ({shouldHighlightActive = false, teamId}: Props) => {
    const theme = useTheme();
    const isTablet = useIsTablet();
    const commonChannelItemStyles = getChannelItemStyleSheet(theme);
    const styles = getStyleSheet(theme);
    const live = useAnyMeetingLive(teamId, true);

    const handlePress = usePreventDoubleTap(useCallback(() => {
        goToUpcomingCalls(isTablet);
    }, [isTablet]));

    const [containerStyle, iconStyle, textStyle] = useMemo(() => {
        const container = [
            commonChannelItemStyles.container,
            HOME_PADDING,
            shouldHighlightActive && commonChannelItemStyles.activeItem,
            shouldHighlightActive && {
                paddingLeft: HOME_PADDING.paddingLeft - commonChannelItemStyles.activeItem.borderLeftWidth,
            },
            {minHeight: ROW_HEIGHT},
        ];

        const icon = [
            styles.icon,
            shouldHighlightActive && styles.iconActive,
        ];

        const text = [
            styles.text,
            channelItemTextStyle.regular,
            commonChannelItemStyles.text,
            shouldHighlightActive && commonChannelItemStyles.textActive,
        ];

        return [container, icon, text];
    }, [commonChannelItemStyles.container, commonChannelItemStyles.activeItem, commonChannelItemStyles.text, commonChannelItemStyles.textActive, shouldHighlightActive, styles.icon, styles.iconActive, styles.text]);

    return (
        <TouchableOpacity
            accessibilityRole='button'
            onPress={handlePress}
            testID='channel_list.upcoming_calls.button'
        >
            <View style={containerStyle}>
                <CompassIcon
                    name='calendar-outline'
                    style={iconStyle}
                    testID='channel_list.upcoming_calls.button-icon'
                />
                <FormattedText
                    id='calendar.upcoming_calls.home_button.title'
                    defaultMessage='Upcoming calls'
                    style={textStyle}
                />
                {live && (
                    <View
                        style={styles.dot}
                        testID='channel_list.upcoming_calls.live_dot'
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default UpcomingCallsButton;
