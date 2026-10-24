// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {DeviceEventEmitter} from 'react-native';

import {Navigation, Screens} from '@constants';
import {navigateToScreen} from '@screens/navigation';

export function goToUpcomingCalls(isTablet = false) {
    if (isTablet) {
        DeviceEventEmitter.emit(Navigation.NAVIGATION_HOME, Screens.CALENDAR_UPCOMING_CALLS);
        return;
    }
    navigateToScreen(Screens.CALENDAR_UPCOMING_CALLS);
}
