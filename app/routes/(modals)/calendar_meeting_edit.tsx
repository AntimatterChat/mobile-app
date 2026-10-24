// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import MeetingEdit, {meetingEditTitle, type MeetingEditProps} from '@calendar/screens/meeting_edit/meeting_edit';
import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getModalHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import {navigateBack} from '@screens/navigation';

export default function CalendarMeetingEditRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const props = usePropsFromParams<MeetingEditProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage(meetingEditTitle),
            ...getModalHeaderOptions(theme, navigateBack, 'close.calendar_meeting_edit.button'),
        },
    });

    return (<MeetingEdit {...props}/>);
}
