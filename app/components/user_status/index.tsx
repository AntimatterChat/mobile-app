// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import CompassIcon, {type CompassIconName} from '@components/compass_icon';
import {General} from '@constants';
import {FOCUS_COLOR} from '@constants/focus';
import {useTheme} from '@context/theme';
import {changeOpacity} from '@utils/theme';

type UserStatusProps = {
    size?: number;
    status?: string;

    // Focus mode (Antimatter): while focusing, Do not disturb shows as the purple dot instead of the usual one.
    focusing?: boolean;
};

const UserStatus = ({size = 6, status = General.OFFLINE, focusing = false}: UserStatusProps) => {
    const theme = useTheme();
    let iconName: CompassIconName;
    let iconColor;
    switch (status) {
        case General.AWAY:
            iconName = 'clock';
            iconColor = theme.awayIndicator;
            break;
        case General.DND:
            iconName = 'minus-circle';
            iconColor = focusing ? FOCUS_COLOR : theme.dndIndicator;
            break;
        case General.ONLINE:
            iconName = 'check-circle';
            iconColor = theme.onlineIndicator;
            break;
        default:
            iconName = 'circle-outline';
            iconColor = changeOpacity('#B8B8B8', 0.64);
            break;
    }

    return (
        <CompassIcon
            name={iconName}
            style={{fontSize: size, color: iconColor}}
            testID={`user_status.indicator.${focusing ? 'focus' : status}`}
        />
    );
};

export default UserStatus;
