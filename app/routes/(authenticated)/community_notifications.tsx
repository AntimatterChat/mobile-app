// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useIntl} from 'react-intl';

import {useTheme} from '@context/theme';
import {getHeaderOptions, useNavigationHeader} from '@hooks/navigation_header';
import {usePropsFromParams} from '@hooks/props_from_params';
import CommunityNotificationsScreen from '@screens/community_notifications';

type CommunityNotificationsRouteProps = {
    teamId: string;
}

export default function CommunityNotificationsRoute() {
    const intl = useIntl();
    const theme = useTheme();
    const {teamId} = usePropsFromParams<CommunityNotificationsRouteProps>();

    useNavigationHeader({
        showWhenPushed: true,
        headerOptions: {
            headerTitle: intl.formatMessage({id: 'community_notifications.header_title', defaultMessage: 'Notification settings'}),
            ...getHeaderOptions(theme),
        },
    });

    return (<CommunityNotificationsScreen teamId={teamId}/>);
}
