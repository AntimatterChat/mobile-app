// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import UpcomingCallsScreen from '@calendar/screens/upcoming_calls';
import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';

export default function CalendarUpcomingCallsRoute() {
    const theme = useTheme();
    const intl = useIntl();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'calendar.upcoming_calls.title', defaultMessage: 'Upcoming calls'}),
            ...getHeaderOptions(theme),
        },
    });

    return (<UpcomingCallsScreen/>);
}
